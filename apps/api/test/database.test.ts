import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { databaseSettings } from '../src/database.ts';

describe('database settings', () => {
  it('reads the host and the secret values from the environment only', () => {
    assert.equal(databaseSettings({}), undefined);
    const settings = databaseSettings({
      DB_HOST: 'db.internal',
      DB_PORT: '5432',
      DB_NAME: 'postgres',
      DB_USER: 'tn_app',
      DB_PASSWORD: 'from-secrets-manager',
    });
    assert.deepEqual(settings, {
      host: 'db.internal',
      port: 5432,
      database: 'postgres',
      user: 'tn_app',
      password: 'from-secrets-manager',
    });
  });
});