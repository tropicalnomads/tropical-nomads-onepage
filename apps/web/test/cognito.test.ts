import assert from 'node:assert/strict';
import { createSign, generateKeyPairSync } from 'node:crypto';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { emptyAccounts, readAccounts, writeAccounts } from 'tropical-nomads-api/accounts';
import {
  authorizeUrl,
  cognitoTarget,
  exchangeAuthCode,
  isCognitoAuthorizeUrl,
  pendingNames,
  readCognitoConfig,
  signInWithCognito,
  verifiedSignInFromClaims,
  verifyIdToken,
  type CognitoConfig,
  type CognitoTarget,
  type IdClaims,
} from '../src/account/cognito.ts';
import { establishVerifiedAccount } from '../src/account/establish.ts';

const pool = 'eu-central-1_TestPool';
const clientId = 'client123';
const nonce = 'nonce-value-0123456789abcd';

function configured(overrides: Record<string, string | undefined> = {}): CognitoConfig | undefined {
  return readCognitoConfig({
    COGNITO_USER_POOL_ID: pool,
    COGNITO_CLIENT_ID: clientId,
    COGNITO_HOSTED_DOMAIN: 'tropical',
    COGNITO_REDIRECT_URI: 'http://127.0.0.1:3000/account/callback',
    COGNITO_GOOGLE: 'true',
    ...overrides,
  });
}

function signer(): { jwk: JsonWebKey & { kid?: string }; sign: (claims: Record<string, unknown>, alg?: string) => string } {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = publicKey.export({ format: 'jwk' }) as JsonWebKey & { kid?: string };
  jwk.kid = 'key-1';
  return {
    jwk,
    sign(claims, alg = 'RS256') {
      const header = Buffer.from(JSON.stringify({ alg, kid: 'key-1' }), 'utf8').toString('base64url');
      const payload = Buffer.from(JSON.stringify(claims), 'utf8').toString('base64url');
      const signature = createSign('RSA-SHA256').update(`${header}.${payload}`).sign(privateKey).toString('base64url');
      return `${header}.${payload}.${signature}`;
    },
  };
}

function claims(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    iss: `https://cognito-idp.eu-central-1.amazonaws.com/${pool}`,
    aud: clientId,
    token_use: 'id',
    nonce,
    exp: Math.floor(Date.now() / 1000) + 120,
    email_verified: true,
    email: 'Ada@Example.com',
    sub: 'sub-ada',
    given_name: 'Ada',
    family_name: 'Lovelace',
    ...overrides,
  };
}

describe('cognito sign-in', () => {
  it('stays unconfigured until Frankfurt hosted UI settings are present', () => {
    assert.equal(readCognitoConfig({}), undefined);
    assert.equal(configured({ COGNITO_REGION: 'us-east-1' }), undefined);
    assert.equal(configured({ COGNITO_REDIRECT_URI: 'https://evil.example/account/callback?next=1' }), undefined);
    assert.equal(configured({ COGNITO_HOSTED_DOMAIN: 'https://evil.example' }), undefined);
    const config = configured();
    assert.ok(config);
    assert.equal(config.region, 'eu-central-1');
    assert.equal(config.google, true);
    assert.equal(config.apple, false);
  });

  it('builds a PKCE URL and rejects a subject or a password on that URL', () => {
    const config = configured();
    assert.ok(config);
    const url = authorizeUrl(config, {
      provider: 'google',
      state: 'state-value-0123456789abcd',
      nonce,
      verifier: 'verifier-value-0123456789abcdefghijklmnopqrstuv',
    });
    assert.ok(url);
    assert.equal(isCognitoAuthorizeUrl(url), true);
    assert.equal(url.includes('identity_provider=Google'), true);
    assert.equal(url.includes('code_challenge_method=S256'), true);
    assert.equal(url.includes('subject'), false);
    assert.equal(url.includes('password'), false);
    assert.equal(authorizeUrl(config, { provider: 'apple', state: 'state-value-0123456789abcd', nonce, verifier: 'verifier-value-0123456789abcdefghijklmnopqrstuv' }), undefined);
  });

  it('accepts a signed id token and refuses an unverified email or the wrong audience', () => {
    const config = configured();
    assert.ok(config);
    const keys = signer();
    const token = keys.sign(claims());
    const verified = verifyIdToken(token, config, { keys: [keys.jwk] }, nonce);
    assert.equal(verified?.email, 'ada@example.com');
    assert.equal(verified?.provider, 'cognito');
    assert.equal(verifyIdToken(keys.sign(claims({ email_verified: false })), config, { keys: [keys.jwk] }, nonce), undefined);
    assert.equal(verifyIdToken(keys.sign(claims({ aud: 'other-client' })), config, { keys: [keys.jwk] }, nonce), undefined);
    assert.equal(verifyIdToken(keys.sign(claims(), 'none'), config, { keys: [keys.jwk] }, nonce), undefined);
    const google = verifyIdToken(
      keys.sign(claims({ identities: [{ providerName: 'Google', userId: 'google-subject-1' }] })),
      config,
      { keys: [keys.jwk] },
      nonce,
    );
    assert.equal(google?.provider, 'google');
    assert.equal(google?.providerSubject, 'google-subject-1');
    const signIn = verified ? verifiedSignInFromClaims(verified, pendingNames({ username: 'Ada', givenName: '', familyName: '' }), undefined) : undefined;
    assert.equal(signIn?.username, 'Ada');
    assert.equal(signIn?.givenName, 'Ada');
  });

  it('creates one profile from a verified token and does not store a password', async () => {
    const config = configured();
    assert.ok(config);
    const keys = signer();
    const verified = verifyIdToken(keys.sign(claims()), config, { keys: [keys.jwk] }, nonce);
    assert.ok(verified);
    const names = pendingNames({ username: 'Ada', givenName: 'Ada', familyName: 'Lovelace' });
    const signIn = verifiedSignInFromClaims(verified as IdClaims, names, undefined);
    assert.ok(signIn);
    const root = mkdtempSync(join(tmpdir(), 'tn-cognito-'));
    writeAccounts(emptyAccounts(), root);
    const sub = await establishVerifiedAccount(signIn, {}, root);
    assert.equal(sub, 'sub-ada');
    const stored = readAccounts(root);
    assert.equal(stored.profiles.length, 1);
    assert.equal(JSON.stringify(stored).includes('password'), false);
    const response = await exchangeAuthCode(config, 'auth-code-1', 'verifier-value-0123456789abcdefghijklmnopqrstuv', async () => {
      return new Response(JSON.stringify({ id_token: 'header.payload.signature', access_token: 'do-not-keep', refresh_token: 'do-not-keep' }), { status: 200 });
    });
    assert.equal(response, 'header.payload.signature');
    assert.equal(response?.includes('do-not-keep'), false);
  });
});

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

  it('creates a profile from a verified password sign-in and refuses an unsigned token', async () => {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const jwk = publicKey.export({ format: 'jwk' }) as JsonWebKey & { kid?: string };
    jwk.kid = 'key-1';
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'key-1' }), 'utf8').toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        iss: `https://cognito-idp.eu-central-1.amazonaws.com/${target.userPoolId}`,
        aud: target.clientId,
        token_use: 'id',
        exp: Math.floor(Date.now() / 1000) + 120,
        email_verified: true,
        email: 'ada@example.com',
        sub: 'sub-ada',
        given_name: 'Ada',
        family_name: 'Lovelace',
        preferred_username: 'Ada',
      }),
      'utf8',
    ).toString('base64url');
    const signature = createSign('RSA-SHA256').update(`${header}.${payload}`).sign(privateKey).toString('base64url');
    const token = `${header}.${payload}.${signature}`;
    const signedIn = await signInWithCognito('ada@example.com', 'a-long-secret-phrase', target, async (url) => {
      if (String(url).includes('jwks')) {
        return { ok: true, status: 200, json: async () => ({ keys: [jwk] }) };
      }
      return { ok: true, status: 200, json: async () => ({ AuthenticationResult: { IdToken: token } }) };
    });
    assert.equal(signedIn.claims?.emailVerified, true);
    assert.equal(signedIn.claims?.preferredUsername, 'Ada');
    assert.ok(signedIn.claims);
    const profile = verifiedSignInFromClaims(signedIn.claims, undefined, undefined);
    assert.equal(profile?.username, 'Ada');
    assert.ok(profile);
    const root = mkdtempSync(join(tmpdir(), 'tn-password-signin-'));
    writeAccounts(emptyAccounts(), root);
    const sub = await establishVerifiedAccount(profile, {}, root);
    const stored = readAccounts(root);
    assert.equal(sub, 'sub-ada');
    assert.equal(stored.profiles.length, 1);
    assert.equal(stored.profiles[0]?.emailVerified, true);
    assert.equal(JSON.stringify(stored).includes('a-long-secret-phrase'), false);
    const forged = await signInWithCognito('ada@example.com', 'a-long-secret-phrase', target, async (url) => {
      if (String(url).includes('jwks')) {
        return { ok: true, status: 200, json: async () => ({ keys: [jwk] }) };
      }
      return { ok: true, status: 200, json: async () => ({ AuthenticationResult: { IdToken: `${header}.${payload}.not-a-signature` } }) };
    });
    assert.equal(forged.sub, undefined);
    assert.equal(forged.claims, undefined);
  });
});
