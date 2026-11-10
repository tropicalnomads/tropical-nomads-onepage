import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { databaseSettings, databaseTls } from '../src/database.ts';

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

  it('requires TLS unless DB_SSL is false', () => {
    assert.equal(databaseTls({ DB_SSL: 'false', DB_HOST: '127.0.0.1' }), false);
    const required = databaseTls({ DB_HOST: 'db.internal' });
    assert.notEqual(required, false);
    if (required !== false) {
      assert.equal(required.servername, 'db.internal');
      assert.equal(required.rejectUnauthorized, true);
    }
    const named = databaseTls({ DB_HOST: '127.0.0.1', DB_SSL: 'true', DB_TLS_SERVERNAME: 'db.internal' });
    assert.notEqual(named, false);
    if (named !== false) {
      assert.equal(named.servername, 'db.internal');
    }
    assert.throws(() => databaseTls({ DB_SSL: 'off' }), /DB_SSL must be true or false/);
  });
});