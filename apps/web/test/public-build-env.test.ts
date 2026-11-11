import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '../../..');

describe('public build environment', () => {
  it('inlines the public Cognito settings and not the session secret', () => {
    const config = readFileSync(join(repo, 'apps/web/next.config.ts'), 'utf8');
    const envBlock = config.slice(config.indexOf('env: {'), config.indexOf('reactStrictMode'));
    for (const key of ['API_BASE_URL', 'COGNITO_USER_POOL_ID', 'COGNITO_CLIENT_ID', 'COGNITO_HOSTED_DOMAIN', 'COGNITO_REDIRECT_URI']) {
      assert.match(envBlock, new RegExp(key));
    }
    assert.equal(envBlock.includes('ACCOUNT_SESSION_SECRET'), false);
    assert.match(readFileSync(join(repo, 'apps/web/src/account/cognito.ts'), 'utf8'), /process\.env\.COGNITO_USER_POOL_ID/);
  });

  it('does not blank Cognito ids in the production env file', () => {
    const production = readFileSync(join(repo, '.env.production'), 'utf8');
    assert.equal(production.includes('COGNITO_USER_POOL_ID='), false);
    assert.equal(production.includes('COGNITO_CLIENT_ID='), false);
    assert.match(production, /API_BASE_URL=https:\/\/api-dev\.tropical-nomads\.com\n/);
    assert.equal(production.includes('elb.amazonaws.com'), false);
  });
});
