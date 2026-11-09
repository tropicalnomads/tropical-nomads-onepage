#!/usr/bin/env bash
# Open a private tunnel to tropical-nomads-frankfurt and refresh the local database keys.
# The password is read from Secrets Manager and is not printed.
set -euo pipefail

region="${AWS_REGION:-eu-central-1}"
root="$(cd "$(dirname "$0")/.." && pwd)"
env_file="$root/.env"

if [[ ! -f "$env_file" ]]; then
  echo "local env file is missing" >&2
  exit 1
fi

endpoint="$(aws rds describe-db-instances --region "$region" --db-instance-identifier tropical-nomads-frankfurt --query 'DBInstances[0].Endpoint.Address' --output text | tr -d '\r')"
secret_id="$(aws rds describe-db-instances --region "$region" --db-instance-identifier tropical-nomads-frankfurt --query 'DBInstances[0].MasterUserSecret.SecretArn' --output text | tr -d '\r')"
password="$(aws secretsmanager get-secret-value --region "$region" --secret-id "$secret_id" --query SecretString --output text | tr -d '\r' | node -e "let s='';process.stdin.on('data',(d)=>s+=d);process.stdin.on('end',()=>{process.stdout.write(JSON.parse(s).password)})")"

TN_DB_PASSWORD="$password" TN_DB_SERVER="$endpoint" TN_ENV_FILE="$env_file" node --input-type=module <<'EOF'
import { readFileSync, writeFileSync } from 'node:fs';

function envValue(value) {
  if (/^[A-Za-z0-9_./:@+-]+$/.test(value)) {
    return value;
  }
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
}

const password = process.env.TN_DB_PASSWORD ?? '';
const servername = process.env.TN_DB_SERVER ?? '';
const file = process.env.TN_ENV_FILE ?? '';
if (password === '' || servername === '' || file === '') {
  process.stderr.write('database settings are incomplete\n');
  process.exit(1);
}
const keys = new Map([
  ['DB_HOST', '127.0.0.1'],
  ['DB_PORT', '5432'],
  ['DB_NAME', 'postgres'],
  ['DB_USER', 'tn_app'],
  ['DB_PASSWORD', password],
  ['DB_TLS_SERVERNAME', servername],
  ['DB_STARTUP_CHECK', 'true'],
]);
let text = readFileSync(file, 'utf8');
for (const [key, value] of keys) {
  const line = `${key}=${envValue(value)}`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  text = pattern.test(text) ? text.replace(pattern, line) : `${text.replace(/\n?$/, '\n')}${line}\n`;
}
writeFileSync(file, text.endsWith('\n') ? text : `${text}\n`);
EOF
unset password
echo "local database keys point at the tunnel"

start_session() {
  if command -v session-manager-plugin >/dev/null 2>&1; then
    aws ssm start-session --region "$region" "$@"
    return
  fi
  if ! docker image inspect tropical-nomads-tunnel >/dev/null 2>&1; then
    docker build -f "$root/database/tunnel.Dockerfile" -t tropical-nomads-tunnel "$root/database"
  fi
  local aws_dir docker_args
  aws_dir="$(cygpath -w "$HOME/.aws" 2>/dev/null || echo "$HOME/.aws")"
  docker_args=(docker run --rm -p 5432:5432 -e "AWS_REGION=$region" -e "AWS_DEFAULT_REGION=$region" -v "${aws_dir}:/root/.aws:ro")
  if [[ -n "${AWS_PROFILE:-}" ]]; then docker_args+=(-e "AWS_PROFILE=$AWS_PROFILE"); fi
  if [[ -n "${AWS_ACCESS_KEY_ID:-}" ]]; then docker_args+=(-e "AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID"); fi
  if [[ -n "${AWS_SECRET_ACCESS_KEY:-}" ]]; then docker_args+=(-e "AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY"); fi
  if [[ -n "${AWS_SESSION_TOKEN:-}" ]]; then docker_args+=(-e "AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN"); fi
  "${docker_args[@]}" tropical-nomads-tunnel ssm start-session --region "$region" "$@"
}

instance="$(aws ec2 describe-instances --region "$region" --filters Name=tag:Name,Values=tropical-nomads-db-tunnel Name=instance-state-name,Values=running --query 'Reservations[0].Instances[0].InstanceId' --output text | tr -d '\r')"
if [[ -n "$instance" && "$instance" != "None" ]]; then
  start_session --target "$instance" \
    --document-name AWS-StartPortForwardingSessionToRemoteHost \
    --parameters "host=${endpoint},portNumber=5432,localPortNumber=5432"
  exit
fi

# This account cannot create an instance profile, so the EC2 tunnel host cannot register with SSM.
# A private Fargate task in the API security group forwards bytes to PostgreSQL. It has no public IP.
task_def="$(aws cloudformation describe-stacks --region "$region" --stack-name tn-frankfurt-ecs-task --query "Stacks[0].Outputs[?OutputKey=='TaskDefinitionArn'].OutputValue" --output text | tr -d '\r')"
proxy='import http from "node:http"; import net from "node:net";
http.createServer((req, res) => { res.writeHead(req.url === "/health" ? 200 : 404); res.end("ok"); }).listen(8787, "127.0.0.1");
net.createServer((socket) => { const remote = net.connect(Number(process.env.DB_PORT), process.env.DB_HOST); socket.pipe(remote); remote.pipe(socket); socket.on("error", () => remote.destroy()); remote.on("error", () => socket.destroy()); }).listen(5432, "127.0.0.1");'
task_json="$(aws ecs run-task --region "$region" --cluster tropical-nomads --task-definition "$task_def" --launch-type FARGATE --enable-execute-command \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-037e74a98a48dd0c2,subnet-0f5bc1df40e14b4e6],securityGroups=[sg-052571ebab1eaea1b],assignPublicIp=DISABLED}" \
  --overrides "$(node -e "process.stdout.write(JSON.stringify({containerOverrides:[{name:'api',command:['node','--input-type=module','-e',process.argv[1]]}]}))" "$proxy")" \
  --query "tasks[0].taskArn" --output text | tr -d '\r')"
task_id="${task_json##*/}"
cleanup() {
  aws ecs stop-task --region "$region" --cluster tropical-nomads --task "$task_id" --reason "tunnel closed" >/dev/null 2>&1 || true
}
trap cleanup EXIT

runtime=""
for _ in $(seq 1 40); do
  runtime="$(aws ecs describe-tasks --region "$region" --cluster tropical-nomads --tasks "$task_id" --query "tasks[0].containers[?name=='api'].runtimeId | [0]" --output text | tr -d '\r')"
  agent="$(aws ecs describe-tasks --region "$region" --cluster tropical-nomads --tasks "$task_id" --query "tasks[0].containers[0].managedAgents[0].lastStatus" --output text | tr -d '\r')"
  if [[ -n "$runtime" && "$runtime" != "None" && "$agent" == "RUNNING" ]]; then
    break
  fi
  sleep 3
done
if [[ -z "$runtime" || "$runtime" == "None" || "$agent" != "RUNNING" ]]; then
  echo "private tunnel task did not open an SSM channel" >&2
  exit 1
fi

echo "private tunnel is ready"
start_session --target "ecs:tropical-nomads_${task_id}_${runtime}" \
  --document-name AWS-StartPortForwardingSession \
  --parameters "portNumber=5432,localPortNumber=5432"
