#!/usr/bin/env bash
# Apply the Frankfurt templates in this directory. The account id and the database
# password are not stored here. EXPECTED_AWS_ACCOUNT must be set by the caller.
set -euo pipefail

export AWS_DEFAULT_REGION=eu-central-1
export AWS_REGION=eu-central-1

if [[ "${EXPECTED_AWS_ACCOUNT:-}" == "" ]]; then
  echo "Set EXPECTED_AWS_ACCOUNT before deploying." >&2
  exit 1
fi

root=$(cd "$(dirname "$0")" && pwd)
repo=$(cd "$root/../.." && pwd)

aws_ff() {
  aws --region eu-central-1 "$@"
}

identity=$(aws_ff sts get-caller-identity --output json)
account=$(python3 -c 'import json,sys; print(json.load(sys.stdin)["Account"])' <<<"$identity")
arn=$(python3 -c 'import json,sys; print(json.load(sys.stdin)["Arn"])' <<<"$identity")

if [[ "$account" != "$EXPECTED_AWS_ACCOUNT" ]]; then
  echo "Refusing to deploy: the caller is not the expected account." >&2
  exit 1
fi
if [[ "$arn" != "arn:aws:iam::${account}:user/tropical-nomads" ]]; then
  echo "Refusing to deploy: the caller is not the tropical-nomads user." >&2
  exit 1
fi

require_dry_run() {
  local label="$1"
  shift
  local err
  err=$("$@" 2>&1) || true
  if ! grep -q DryRunOperation <<<"$err"; then
    echo "Missing permission: $label" >&2
    exit 1
  fi
}

require_not_denied() {
  local label="$1"
  shift
  local err
  err=$("$@" 2>&1) || true
  if grep -Eq 'not authorized|UnauthorizedOperation|AccessDenied' <<<"$err"; then
    echo "Missing permission: $label" >&2
    exit 1
  fi
}

require_dry_run ec2:AllocateAddress aws_ff ec2 allocate-address --domain vpc --dry-run
require_not_denied ec2:ReleaseAddress aws_ff ec2 release-address --allocation-id eipalloc-00000000 --dry-run
require_not_denied ec2:DeleteNatGateway aws_ff ec2 delete-nat-gateway --nat-gateway-id nat-00000000000000000 --dry-run

deploy_stack() {
  local name="$1"
  local file="$2"
  shift 2
  aws_ff cloudformation deploy \
    --stack-name "$name" \
    --template-file "$file" \
    --no-fail-on-empty-changeset \
    --capabilities CAPABILITY_NAMED_IAM \
    --tags Project=tropical-nomads \
    "$@"
  echo "stack $name"
}

stack_output() {
  aws_ff cloudformation describe-stacks \
    --stack-name "$1" \
    --query "Stacks[0].Outputs[?OutputKey=='$2'].OutputValue" \
    --output text
}

deploy_stack tn-frankfurt-vpc "$root/vpc.yaml"
vpc_id=$(stack_output tn-frankfurt-vpc VpcId)
public_a=$(stack_output tn-frankfurt-vpc PublicSubnetA)
public_b=$(stack_output tn-frankfurt-vpc PublicSubnetB)
private_a=$(stack_output tn-frankfurt-vpc PrivateSubnetA)
private_b=$(stack_output tn-frankfurt-vpc PrivateSubnetB)

deploy_stack tn-frankfurt-security-groups "$root/security-groups.yaml" \
  --parameter-overrides "VpcId=${vpc_id}"
alb_sg=$(stack_output tn-frankfurt-security-groups AlbSecurityGroupId)
api_sg=$(stack_output tn-frankfurt-security-groups ApiSecurityGroupId)
db_sg=$(stack_output tn-frankfurt-security-groups DbSecurityGroupId)

deploy_stack tn-frankfurt-logs "$root/log-group.yaml"
deploy_stack tn-frankfurt-assets "$root/s3-assets.yaml"
assets_bucket=$(stack_output tn-frankfurt-assets BucketName)
assets_arn=$(stack_output tn-frankfurt-assets BucketArn)
deploy_stack tn-frankfurt-cognito "$root/cognito-user-pool.yaml"
pool_id=$(stack_output tn-frankfurt-cognito UserPoolId)
client_id=$(stack_output tn-frankfurt-cognito UserPoolClientId)
deploy_stack tn-frankfurt-ecr "$root/ecr-api.yaml"
deploy_stack tn-frankfurt-amplify "$root/amplify-web-app.yaml" \
  --parameter-overrides "CognitoUserPoolId=${pool_id}" "CognitoClientId=${client_id}"
deploy_stack tn-frankfurt-ecs-cluster "$root/ecs-cluster.yaml"
cert_arn=$(aws_ff acm list-certificates --query "CertificateSummaryList[?DomainName=='api-dev.tropical-nomads.com'].CertificateArn | [0]" --output text)
deploy_stack tn-frankfurt-alb "$root/load-balancer.yaml" \
  --parameter-overrides "VpcId=${vpc_id}" "PublicSubnetA=${public_a}" "PublicSubnetB=${public_b}" "AlbSecurityGroupId=${alb_sg}" "CertificateArn=${cert_arn}"
target_group=$(stack_output tn-frankfurt-alb TargetGroupArn)

tunnel_ami=$(aws_ff ec2 describe-images --owners amazon --filters Name=name,Values='al2023-ami-2023.*-kernel-6.*-arm64' Name=state,Values=available --query 'sort_by(Images,&CreationDate)[-1].ImageId' --output text)
deploy_stack tn-frankfurt-db-tunnel-host "$root/db-bastion.yaml" \
  --parameter-overrides "VpcId=${vpc_id}" "PrivateSubnetA=${private_a}" "DbSecurityGroupId=${db_sg}" "ImageId=${tunnel_ami}" "InstanceProfileName=tropical-nomads-db-tunnel"

deploy_stack tn-frankfurt-rds "$root/rds-postgres.yaml" \
  --parameter-overrides "PrivateSubnetA=${private_a}" "PrivateSubnetB=${private_b}" "DbSecurityGroupId=${db_sg}"
secret_arn=$(stack_output tn-frankfurt-rds DbSecretArn)
session_arn=$(aws_ff secretsmanager describe-secret --secret-id tropical-nomads/api/session --query ARN --output text)

deploy_stack tn-frankfurt-iam "$root/iam-api.yaml" \
  --parameter-overrides "DbSecretArn=${secret_arn}" "SessionSecretArn=${session_arn}" "AssetsBucketArn=${assets_arn}"
execution_role=$(stack_output tn-frankfurt-iam ExecutionRoleArn)
task_role=$(stack_output tn-frankfurt-iam TaskRoleArn)
log_group=$(stack_output tn-frankfurt-logs LogGroupName)

tag=$(git -C "$repo" rev-parse --short=12 HEAD)
image="${account}.dkr.ecr.eu-central-1.amazonaws.com/tropical-nomads-api:${tag}"
if ! aws_ff ecr describe-images --repository-name tropical-nomads-api --image-ids "imageTag=${tag}" >/dev/null 2>&1; then
  aws_ff ecr get-login-password | docker login --username AWS --password-stdin "${account}.dkr.ecr.eu-central-1.amazonaws.com" >/dev/null
  docker build -f "$repo/apps/api/Dockerfile" -t "$image" "$repo"
  docker push "$image"
  echo "pushed api image ${tag}"
else
  echo "api image ${tag} already exists"
fi

db_host=$(aws_ff rds describe-db-instances --db-instance-identifier tropical-nomads-frankfurt --query 'DBInstances[0].Endpoint.Address' --output text)
deploy_stack tn-frankfurt-ecs-task "$root/ecs-task.yaml" \
  --parameter-overrides "ExecutionRoleArn=${execution_role}" "TaskRoleArn=${task_role}" "Image=${image}" "LogGroupName=${log_group}" "DbSecretArn=${secret_arn}" "DbHost=${db_host}" "SessionSecretArn=${session_arn}" "AssetsBucketName=${assets_bucket}"
task_arn=$(stack_output tn-frankfurt-ecs-task TaskDefinitionArn)
cluster=$(stack_output tn-frankfurt-ecs-cluster ClusterName)

deploy_stack tn-frankfurt-ecs-service "$root/ecs-service.yaml" \
  --parameter-overrides "ClusterName=${cluster}" "TaskDefinitionArn=${task_arn}" "PrivateSubnetA=${private_a}" "PrivateSubnetB=${private_b}" "ApiSecurityGroupId=${api_sg}" "TargetGroupArn=${target_group}"

echo "Frankfurt templates applied"
