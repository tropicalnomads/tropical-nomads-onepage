import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { taskDefinitionForImage } from './roll-api-image.mjs';

const image =
  '111111111111.dkr.ecr.eu-central-1.amazonaws.com/tropical-nomads-api:abc123def456';

function currentTask() {
  return {
    family: 'tropical-nomads-api',
    revision: 4,
    taskDefinitionArn: 'arn:aws:ecs:eu-central-1:000000000000:task-definition/tropical-nomads-api:4',
    status: 'ACTIVE',
    requiresAttributes: [{ name: 'com.amazonaws.ecs.capability.logging-driver.awslogs' }],
    compatibilities: ['FARGATE'],
    cpu: '512',
    memory: '1024',
    networkMode: 'awsvpc',
    requiresCompatibilities: ['FARGATE'],
    runtimePlatform: { cpuArchitecture: 'X86_64', operatingSystemFamily: 'LINUX' },
    executionRoleArn: 'arn:aws:iam::000000000000:role/tropical-nomads-api-execution',
    taskRoleArn: 'arn:aws:iam::000000000000:role/tropical-nomads-api-task',
    volumes: [],
    placementConstraints: [],
    containerDefinitions: [
      {
        name: 'api',
        image: '111111111111.dkr.ecr.eu-central-1.amazonaws.com/tropical-nomads-api:old',
        cpu: 0,
        essential: true,
        user: '1000',
        command: [],
        entryPoint: [],
        links: [],
        portMappings: [{ containerPort: 8787, hostPort: 8787, protocol: 'tcp' }],
        environment: [
          { name: 'API_PORT', value: '8787' },
          { name: 'DB_HOST', value: 'db.example.internal' },
        ],
        secrets: [
          { name: 'DB_USER', valueFrom: 'arn:aws:secretsmanager:eu-central-1:000000000000:secret:db:username::' },
          { name: 'DB_PASSWORD', valueFrom: 'arn:aws:secretsmanager:eu-central-1:000000000000:secret:db:password::' },
          { name: 'ACCOUNT_SESSION_SECRET', valueFrom: 'arn:aws:secretsmanager:eu-central-1:000000000000:secret:session' },
        ],
        logConfiguration: {
          logDriver: 'awslogs',
          options: { 'awslogs-group': '/tropical-nomads/api', 'awslogs-region': 'eu-central-1' },
        },
      },
    ],
  };
}

describe('task definition image roll', () => {
  it('replaces only the image and keeps the secret wiring', () => {
    const source = currentTask();
    const next = taskDefinitionForImage(source, image);
    const container = next.containerDefinitions[0];
    assert.equal(container.image, image);
    assert.deepEqual(container.secrets, source.containerDefinitions[0].secrets);
    assert.deepEqual(container.environment, [
      ...source.containerDefinitions[0].environment,
      { name: 'ASSETS_BUCKET', value: 'tropical-nomads-assets-111111111111' },
    ]);
    assert.equal(container.user, '1000');
    assert.equal(next.cpu, '512');
    assert.equal(next.memory, '1024');
    assert.equal(next.revision, undefined);
    assert.equal(next.taskDefinitionArn, undefined);
    assert.equal(container.command, undefined);
    assert.equal(container.cpu, undefined);
    assert.equal(next.volumes, undefined);
  });

  it('keeps an assets bucket that is already set', () => {
    const source = currentTask();
    source.containerDefinitions[0].environment.push({ name: 'ASSETS_BUCKET', value: 'tropical-nomads-assets-000000000000' });
    const next = taskDefinitionForImage(source, image);
    const bucket = next.containerDefinitions[0].environment.find((item) => item.name === 'ASSETS_BUCKET');
    assert.equal(bucket.value, 'tropical-nomads-assets-000000000000');
  });

  it('rejects an image that is not the Frankfurt API repository', () => {
    assert.throws(
      () => taskDefinitionForImage(currentTask(), 'public.ecr.aws/other:latest'),
      /Frankfurt API repository/,
    );
  });

  it('rejects a task that dropped the database secret wiring', () => {
    const source = currentTask();
    source.containerDefinitions[0].secrets = source.containerDefinitions[0].secrets.filter(
      (item) => item.name !== 'DB_PASSWORD',
    );
    assert.throws(() => taskDefinitionForImage(source, image), /DB_PASSWORD/);
  });
});
