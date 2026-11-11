import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const region = 'eu-central-1';
const family = 'tropical-nomads-api';
const cluster = 'tropical-nomads';
const service = 'tropical-nomads-api';
const requiredSecrets = ['DB_USER', 'DB_PASSWORD', 'ACCOUNT_SESSION_SECRET'];

const imagePattern =
  /^[0-9]{12}\.dkr\.ecr\.eu-central-1\.amazonaws\.com\/tropical-nomads-api:[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$/;

const taskKeys = [
  'family',
  'taskRoleArn',
  'executionRoleArn',
  'networkMode',
  'containerDefinitions',
  'volumes',
  'placementConstraints',
  'requiresCompatibilities',
  'cpu',
  'memory',
  'runtimePlatform',
  'pidMode',
  'ipcMode',
  'proxyConfiguration',
  'inferenceAccelerators',
  'ephemeralStorage',
];

const containerKeys = [
  'name',
  'image',
  'essential',
  'portMappings',
  'environment',
  'secrets',
  'user',
  'logConfiguration',
  'healthCheck',
  'command',
  'entryPoint',
  'workingDirectory',
  'dependsOn',
];

function assetsBucketName(image) {
  const account = image.slice(0, image.indexOf('.'));
  return `tropical-nomads-assets-${account}`;
}

function environmentWithAssets(environment, image) {
  const entries = Array.isArray(environment) ? environment.filter((item) => item?.name !== 'ASSETS_BUCKET') : [];
  const existing = Array.isArray(environment)
    ? environment.find((item) => item?.name === 'ASSETS_BUCKET' && typeof item.value === 'string' && item.value !== '')
    : undefined;
  entries.push({ name: 'ASSETS_BUCKET', value: existing?.value ?? assetsBucketName(image) });
  return entries;
}

function isEmpty(value) {
  if (value == null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

export function taskDefinitionForImage(taskDefinition, image) {
  if (typeof image !== 'string' || !imagePattern.test(image)) {
    throw new Error('Refusing to roll an image outside the Frankfurt API repository.');
  }
  const containers = taskDefinition.containerDefinitions;
  if (!Array.isArray(containers) || containers.length !== 1 || containers[0]?.name !== 'api') {
    throw new Error('Refusing to roll a task that is not the single api container.');
  }

  const next = { family };
  for (const key of taskKeys) {
    if (key === 'family' || taskDefinition[key] === undefined) continue;
    next[key] = taskDefinition[key];
  }
  if (isEmpty(next.volumes)) delete next.volumes;
  if (isEmpty(next.placementConstraints)) delete next.placementConstraints;

  const source = containers[0];
  const container = { name: 'api', image };
  for (const key of containerKeys) {
    if (key === 'name' || key === 'image' || source[key] === undefined) continue;
    if (isEmpty(source[key]) && key !== 'essential') continue;
    container[key] = source[key];
  }
  const secretNames = (container.secrets ?? []).map((item) => item.name);
  for (const name of requiredSecrets) {
    if (!secretNames.includes(name)) {
      throw new Error(`Refusing to roll a task that does not wire ${name}.`);
    }
  }
  container['environment'] = environmentWithAssets(source['environment'], image);
  next.containerDefinitions = [container];
  return next;
}

function runAws(args, { timeout } = {}) {
  const result = spawnSync('aws', ['--region', region, ...args], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    timeout,
  });
  if (result.error) {
    throw new Error('AWS CLI could not start.');
  }
  if (result.status !== 0) {
    const detail = (result.stderr || '').trim().split('\n').slice(-2).join(' ');
    throw new Error(detail || 'AWS CLI failed.');
  }
  return result.stdout;
}

function imageFromArgs(argv) {
  const index = argv.indexOf('--image');
  const image = index === -1 ? undefined : argv[index + 1];
  if (!image) {
    throw new Error('Pass --image with the ECR image URI.');
  }
  return image;
}

function roll(image) {
  const raw = runAws([
    'ecs',
    'describe-task-definition',
    '--task-definition',
    family,
    '--query',
    'taskDefinition',
    '--output',
    'json',
  ]);
  let current;
  try {
    current = JSON.parse(raw);
  } catch {
    throw new Error('Could not read the current task definition.');
  }
  const next = taskDefinitionForImage(current, image);
  const directory = mkdtempSync(join(tmpdir(), 'tn-api-roll-'));
  const file = join(directory, 'task.json');
  try {
    writeFileSync(file, JSON.stringify(next), { mode: 0o600 });
    const revision = runAws([
      'ecs',
      'register-task-definition',
      '--cli-input-json',
      `file://${file}`,
      '--query',
      'taskDefinition.revision',
      '--output',
      'text',
    ]).trim();
    const taskDefinition = `${family}:${revision}`;
    runAws([
      'ecs',
      'update-service',
      '--cluster',
      cluster,
      '--service',
      service,
      '--task-definition',
      taskDefinition,
      '--query',
      'service.serviceName',
      '--output',
      'text',
    ]);
    console.log(`rolling ${service} to ${taskDefinition}`);
    runAws(
      ['ecs', 'wait', 'services-stable', '--cluster', cluster, '--services', service],
      { timeout: 20 * 60 * 1000 },
    );
    console.log(`${service} is stable on ${taskDefinition}`);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function isDirectRun() {
  const entry = process.argv[1];
  return Boolean(entry) && import.meta.url === pathToFileURL(entry).href;
}

if (isDirectRun()) {
  try {
    roll(imageFromArgs(process.argv));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'API roll failed.';
    console.error(message);
    process.exit(1);
  }
}
