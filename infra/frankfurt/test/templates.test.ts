import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

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

  it('leaves Google and Apple unconfigured', () => {
    const pool = read(join(frankfurt, 'cognito-user-pool.yaml'));
    assert.match(pool, /SupportedIdentityProviders:\n        - COGNITO/);
    assert.equal(pool.includes('AWS::Cognito::UserPoolIdentityProvider'), false);
    assert.equal(pool.includes('SignInWithApple'), false);
    assert.equal(pool.includes('accounts.google.com'), false);
    assert.match(pool, /GenerateSecret: false/);
  });

  it('creates a separate Amplify app with no domain and no token', () => {
    const amplify = read(join(frankfurt, 'amplify-web-app.yaml'));
    const onePager = read(join(repo, 'amplify.yml'));
    assert.match(amplify, /Name: tropical-nomads-web/);
    assert.equal(amplify.includes('Repository:'), false);
    assert.equal(amplify.includes('AccessToken'), false);
    assert.equal(amplify.includes('OauthToken'), false);
    assert.equal(amplify.includes('AWS::Amplify::Domain'), false);
    assert.match(onePager, /tropical-nomads-page/);
    assert.equal(onePager.includes('tropical-nomads-web'), false);
  });

  it('does not publish the API or give the task a public address', () => {
    const balancer = read(join(frankfurt, 'load-balancer.yaml'));
    const service = read(join(frankfurt, 'ecs-service.yaml'));
    const task = read(join(frankfurt, 'ecs-task.yaml'));
    assert.equal(balancer.includes('AWS::ElasticLoadBalancingV2::Listener'), false);
    assert.match(service, /AssignPublicIp: DISABLED/);
    assert.equal(service.includes('LoadBalancers:'), false);
    assert.match(task, /Cpu: "512"/);
    assert.match(task, /Memory: "1024"/);
    assert.equal(task.includes('DATABASE_URL'), false);
    assert.equal(task.includes('secrets:'), false);
  });

  it('keeps the status page on loopback and away from secret values', () => {
    const server = read(join(frankfurt, 'status/server.py'));
    const page = read(join(frankfurt, 'status/index.html'));
    assert.match(server, /HOST = "127\.0\.0\.1"/);
    assert.equal(server.includes('get-secret-value'), false);
    assert.match(page, /Refresh all/);
    assert.match(page, /\/api\/\$\{id\}/);
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
