import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const require = createRequire(import.meta.url);

const here = dirname(fileURLToPath(import.meta.url));
const frankfurt = dirname(here);
const repo = dirname(dirname(frankfurt));

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

function templates(): string[] {
  return readdirSync(frankfurt)
    .filter((name) => name.endsWith('.yaml') || name.endsWith('.sh'))
    .map((name) => join(frankfurt, name));
}

describe('Frankfurt templates', () => {
  it('keeps account ids, passwords, and other regions out of the files', () => {
    const paths = [
      ...templates(),
      join(repo, 'apps/api/Dockerfile'),
      join(repo, '.dockerignore'),
      join(frankfurt, 'status/server.py'),
      join(frankfurt, 'status/index.html'),
    ];
    for (const path of paths) {
      const text = read(path);
      assert.equal(text.includes('624248574874'), false, path);
      assert.equal(text.includes('AKIA'), false, path);
      assert.equal(text.includes('BEGIN PRIVATE'), false, path);
      assert.equal(text.includes('aws_secret_access_key'), false, path);
      assert.equal(/(?<![A-Za-z])MasterUserPassword:/.test(text), false, path);
      assert.equal(text.includes('us-east-1'), false, path);
      assert.equal(text.includes('eu-west-1'), false, path);
    }
  });

  it('keeps the database private and single-AZ', () => {
    const database = read(join(frankfurt, 'rds-postgres.yaml'));
    assert.match(database, /PubliclyAccessible: false/);
    assert.match(database, /MultiAZ: false/);
    assert.match(database, /db\.t4g\.small/);
    assert.match(database, /EngineVersion: "16\.15"/);
    assert.match(database, /ManageMasterUserPassword: true/);
    assert.match(database, /StorageEncrypted: true/);
    assert.equal(database.includes('0.0.0.0/0'), false);
  });

  it('opens 5432 only to the API security group', () => {
    const groups = read(join(frankfurt, 'security-groups.yaml'));
    const lines = groups.split('\n');
    let publicCidrs = 0;
    for (let index = 0; index < lines.length; index += 1) {
      if (!lines[index]?.includes('0.0.0.0/0')) {
        continue;
      }
      publicCidrs += 1;
      const window = lines.slice(Math.max(0, index - 6), index + 1).join('\n');
      assert.match(window, /FromPort: 443/);
      assert.match(window, /ToPort: 443/);
      assert.equal(window.includes('5432'), false);
    }
    assert.equal(publicCidrs, 2);
  });

  it('uses the internet route only on the VPC route tables', () => {
    const vpc = read(join(frankfurt, 'vpc.yaml'));
    assert.equal(vpc.includes('CidrIp:'), false);
    assert.match(vpc, /DestinationCidrBlock: 0\.0\.0\.0\/0/);
  });

  it('adds Google and Apple only when parameters are set', () => {
    const pool = read(join(frankfurt, 'cognito-user-pool.yaml'));
    assert.match(pool, /Condition: UseGoogle/);
    assert.match(pool, /Condition: UseApple/);
    assert.match(pool, /GoogleClientId:/);
    assert.match(pool, /Default: ""/);
    assert.match(pool, /- COGNITO/);
    assert.match(pool, /GenerateSecret: false/);
    assert.equal(pool.includes('accounts.google.com'), false);
    assert.equal(pool.includes('BEGIN PRIVATE'), false);
    assert.match(pool, /email_verified: email_verified/);
    assert.match(pool, /picture: picture/);
    assert.match(pool, /locale: locale/);
    assert.match(pool, /PreSignUp: !GetAtt GoogleLinkFunction.Arn/);
    const source = read(join(frankfurt, 'cognito-link-google.cjs'));
    assert.ok(Buffer.byteLength(source) < 4096);
    for (const line of source.split('\n')) {
      if (line.trim() !== '') {
        assert.equal(pool.includes(line), true);
      }
    }
    const linked = require('../cognito-link-google.cjs') as {
      linkDecision: (input: {
        trigger: string;
        userName: string;
        email: string;
        users: { username: string; email: string; emailVerified: boolean }[];
      }) => { action: string; username?: string; subject?: string };
    };
    const users = [{ username: 'ada@example.com', email: 'Ada@Example.com', emailVerified: true }];
    assert.deepEqual(linked.linkDecision({ trigger: 'PreSignUp_SignUp', userName: 'Google_123', email: 'ada@example.com', users }), {
      action: 'ignore',
    });
    assert.deepEqual(linked.linkDecision({ trigger: 'PreSignUp_ExternalProvider', userName: 'Google_123', email: 'ada@example.com', users }), {
      action: 'link',
      username: 'ada@example.com',
      subject: '123',
    });
    assert.deepEqual(
      linked.linkDecision({
        trigger: 'PreSignUp_ExternalProvider',
        userName: 'Google_123',
        email: 'ada@example.com',
        users: [{ username: 'ada@example.com', email: 'ada@example.com', emailVerified: false }],
      }),
      { action: 'confirm' },
    );
    assert.deepEqual(linked.linkDecision({ trigger: 'PreSignUp_ExternalProvider', userName: 'Google_123', email: 'new@example.com', users: [] }), {
      action: 'confirm',
    });
    assert.deepEqual(linked.linkDecision({ trigger: 'PreSignUp_ExternalProvider', userName: 'google_123', email: 'ada@example.com', users }), {
      action: 'link',
      username: 'ada@example.com',
      subject: '123',
    });
    assert.deepEqual(
      linked.linkDecision({
        trigger: 'PreSignUp_ExternalProvider',
        userName: 'Google_123',
        email: 'ada@example.com',
        users: [
          { username: 'one', email: 'ada@example.com', emailVerified: true },
          { username: 'two', email: 'ada@example.com', emailVerified: true },
        ],
      }),
      { action: 'ignore' },
    );
  });

  it('keeps the web Amplify definitions free of domains and repository tokens', () => {
    const amplify = read(join(frankfurt, 'amplify-web-app.yaml'));
    const onePager = read(join(repo, 'amplify.yml'));
    assert.match(amplify, /Name: tropical-nomads-web/);
    assert.equal(amplify.includes('Repository:'), false);
    assert.equal(amplify.includes('AccessToken'), false);
    assert.equal(amplify.includes('OauthToken'), false);
    assert.equal(amplify.includes('AWS::Amplify::Domain'), false);
    assert.match(onePager, /tropical-nomads-page/);
    assert.match(onePager, /apps\/one-pager\/dist/);
    assert.match(onePager, /appRoot: apps\/web/);
    assert.match(onePager, /tropical-nomads-web/);
    assert.match(onePager, /ensure-amplify-next\.mjs/);
    assert.match(amplify, /ensure-amplify-next\.mjs/);
    assert.match(amplify, /API_BASE_URL/);
    assert.match(amplify, /https:\/\/api-dev\.tropical-nomads\.com/);
    assert.match(amplify, /COGNITO_REDIRECT_URI/);
    assert.match(amplify, /https:\/\/dev\.tropical-nomads\.com\/account\/callback/);
    assert.equal(amplify.includes('ACCOUNT_SESSION_SECRET'), false);
    assert.match(read(join(repo, 'pnpm-workspace.yaml')), /nodeLinker: hoisted/);
    assert.equal(onePager.includes('AccessToken'), false);
    assert.equal(onePager.includes('OauthToken'), false);
  });

  it('publishes only the dev API hostname and keeps the database closed', () => {
    const frontDoor = read(join(frankfurt, 'api-http.yaml'));
    const service = read(join(frankfurt, 'ecs-service.yaml'));
    const task = read(join(frankfurt, 'ecs-task.yaml'));
    const vpc = read(join(frankfurt, 'vpc.yaml'));
    const bastion = read(join(frankfurt, 'db-bastion.yaml'));
    const deploy = read(join(frankfurt, 'deploy.sh'));
    assert.match(frontDoor, /ProtocolType: HTTP/);
    assert.match(frontDoor, /api-dev\.tropical-nomads\.com/);
    assert.equal(frontDoor.includes('www.tropical-nomads.com'), false);
    assert.match(service, /AssignPublicIp: ENABLED/);
    assert.equal(service.includes('LoadBalancers:'), false);
    assert.match(task, /Cpu: "512"/);
    assert.match(task, /Memory: "1024"/);
    assert.equal(task.includes('DATABASE_URL'), false);
    assert.match(task, /ValueFrom: !Sub "\$\{DbSecretArn\}:password::"/);
    assert.match(task, /ValueFrom: !Sub "\$\{DbSecretArn\}:username::"/);
    assert.match(task, /ACCOUNT_SESSION_SECRET/);
    assert.equal(vpc.includes('AWS::EC2::NatGateway'), false);
    assert.equal(deploy.includes('load-balancer.yaml'), false);
    assert.match(bastion, /AssociatePublicIpAddress: false/);
    assert.equal(bastion.includes('0.0.0.0/0') && /FromPort: 5432[\s\S]{0,80}0\.0\.0\.0\/0/.test(bastion), false);
  });

  it('never pairs port 5432 with a public address', () => {
    for (const path of templates()) {
      const lines = read(path).split('\n');
      for (let index = 0; index < lines.length; index += 1) {
        if (!lines[index]?.includes('5432')) {
          continue;
        }
        const window = lines.slice(Math.max(0, index - 6), index + 6).join('\n');
        assert.equal(window.includes('0.0.0.0/0'), false, path);
      }
    }
  });

  it('keeps the status page on loopback and away from secret values', () => {
    const server = read(join(frankfurt, 'status/server.py'));
    const page = read(join(frankfurt, 'status/index.html'));
    assert.match(server, /HOST = "127\.0\.0\.1"/);
    assert.equal(server.includes('get-secret-value'), false);
    assert.match(page, /Refresh all/);
    assert.match(page, /\/api\/\$\{id\}/);
  });

  it('keeps the assets bucket private and shop objects on one prefix', () => {
    const bucket = read(join(frankfurt, 's3-assets.yaml'));
    const iam = read(join(frankfurt, 'iam-api.yaml'));
    const task = read(join(frankfurt, 'ecs-task.yaml'));
    assert.match(bucket, /BlockPublicAcls: true/);
    assert.match(bucket, /BlockPublicPolicy: true/);
    assert.match(bucket, /IgnorePublicAcls: true/);
    assert.match(bucket, /RestrictPublicBuckets: true/);
    assert.match(bucket, /SSEAlgorithm: AES256/);
    assert.match(bucket, /BucketOwnerEnforced/);
    assert.match(bucket, /aws:SecureTransport/);
    assert.match(bucket, /Prefix: shop\//);
    assert.equal(bucket.includes('Effect: Allow'), false);
    assert.match(iam, /\$\{AssetsBucketArn\}\/shop\/\*/);
    assert.match(iam, /cognito-idp:AdminDeleteUser/);
    assert.match(iam, /cognito-idp:ListUsers/);
    assert.match(iam, /s3:prefix/);
    assert.equal(iam.includes('Action: "s3:*"'), false);
    assert.match(task, /ASSETS_BUCKET/);
    assert.match(task, /COGNITO_USER_POOL_ID/);
    assert.match(task, /UserPoolId/);
  });

  it('deploys dev from GitHub Actions without the one-pager or an HTTP listener', () => {
    const workflow = read(join(repo, '.github/workflows/deploy-dev.yml'));
    const role = read(join(frankfurt, 'github-dev-deploy.yaml'));
    const roll = read(join(repo, 'scripts/roll-api-image.mjs'));
    assert.match(workflow, /branches:\n\s+- dev\n/);
    assert.equal(workflow.includes('pull_request'), false);
    assert.equal(workflow.includes('workflow_dispatch'), false);
    assert.equal(workflow.includes('- master'), false);
    assert.equal(workflow.includes('www.tropical-nomads.com'), false);
    assert.equal(workflow.includes('amplify start-job'), false);
    assert.equal(workflow.includes('d3rt3rqkclbrw5'), false);
    assert.match(workflow, /tropical-nomads-github-dev-deploy/);
    assert.match(workflow, /apps\/api\/Dockerfile/);
    assert.equal(workflow.includes('AWS_ACCESS_KEY_ID'), false);
    assert.equal(workflow.includes('AWS_SECRET_ACCESS_KEY'), false);
    assert.equal(workflow.includes('.env'), false);
    assert.equal(workflow.includes('Protocol: HTTP'), false);
    assert.match(role, /RoleName: tropical-nomads-github-dev-deploy/);
    assert.match(role, /AWS::IAM::OIDCProvider/);
    assert.match(role, /https:\/\/token\.actions\.githubusercontent\.com/);
    assert.match(role, /sts\.amazonaws\.com/);
    assert.match(role, /ref:refs\/heads\/dev/);
    assert.equal(role.includes('StringLike'), false);
    assert.equal(role.includes('secretsmanager'), false);
    assert.equal(role.includes('elasticloadbalancing'), false);
    assert.equal(role.includes('s3:'), false);
    assert.equal(role.includes('rds:'), false);
    assert.match(role, /d3rt3rqkclbrw5/);
    assert.match(read(join(frankfurt, 'deploy.sh')), /tn-frankfurt-github-dev-deploy/);
    assert.equal(roll.includes('get-secret-value'), false);
    assert.equal(roll.includes('.env'), false);
  });

  it('keeps operational data and the one-pager build out of the image', () => {
    const dockerfile = read(join(repo, 'apps/api/Dockerfile'));
    const ignore = read(join(repo, '.dockerignore'));
    assert.equal(dockerfile.includes('apps/one-pager/dist'), false);
    assert.equal(dockerfile.includes('data/operational'), false);
    assert.match(dockerfile, /API_HOSTNAME=127\.0\.0\.1/);
    assert.match(ignore, /^data$/m);
  });
});
