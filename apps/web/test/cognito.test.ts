import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { cognitoTarget, signInWithCognito, type CognitoTarget } from '../src/account/cognito.ts';

const target: CognitoTarget = {
  region: 'eu-central-1',
  userPoolId: 'eu-central-1_examplepool',
  clientId: 'abcdefghijklmnopqrstuvwx',
};

describe('cognito settings', () => {
  it('stays unconfigured until the pool and client are both set', () => {
    assert.equal(cognitoTarget({}), undefined);
    assert.equal(cognitoTarget({ COGNITO_USER_POOL_ID: 'eu-central-1_examplepool' }), undefined);
    assert.equal(cognitoTarget({ COGNITO_USER_POOL_ID: 'us-east-1_examplepool', COGNITO_CLIENT_ID: target.clientId }), undefined);
    assert.deepEqual(
      cognitoTarget({ COGNITO_USER_POOL_ID: target.userPoolId, COGNITO_CLIENT_ID: target.clientId, COGNITO_CLIENT_SECRET: 'do-not-use' }),
      target,
    );
  });

  it('maps a refused sign-in and does not keep the password', async () => {
    let sent = '';
    const result = await signInWithCognito('ada@example.com', 'a-long-secret-phrase', target, async (_url, init) => {
      sent = init.body;
      return {
        ok: false,
        status: 400,
        json: async () => ({ __type: 'NotAuthorizedException', message: 'Incorrect username or password.' }),
      };
    });
    assert.equal(result.notice, 'password-rejected');
    assert.equal(result.sub, undefined);
    assert.equal(sent.includes('a-long-secret-phrase'), true);
    assert.equal(JSON.stringify(result).includes('a-long-secret-phrase'), false);
  });
});
