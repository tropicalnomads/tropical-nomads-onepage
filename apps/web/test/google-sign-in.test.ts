import assert from 'node:assert/strict';
import { createSign, generateKeyPairSync, type JsonWebKey } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { usernameForSignIn } from 'tropical-nomads-shared';
import {
  browserAccountOrigin,
  googleStartRedirect,
  hostedCallbackDecision,
  noticeForAccountError,
  readCognitoConfig,
  readIdToken,
  registerWithCognito,
  verifiedSignInFromClaims,
  verifyIdToken,
  type CognitoConfig,
  type CognitoTarget,
  type IdClaims,
} from '../src/account/cognito.ts';
import { googlePictureUrl, readGooglePicture } from '../src/account/google-picture.ts';

const pool = 'eu-central-1_TestPool';
const clientId = 'client123';
const nonce = 'nonce-value-0123456789abcd';
const target: CognitoTarget = {
  region: 'eu-central-1',
  userPoolId: 'eu-central-1_examplepool',
  clientId: 'abcdefghijklmnopqrstuvwx',
};

function configured(): CognitoConfig {
  const config = readCognitoConfig({
    COGNITO_USER_POOL_ID: pool,
    COGNITO_CLIENT_ID: clientId,
    COGNITO_HOSTED_DOMAIN: 'tropical',
    COGNITO_REDIRECT_URI: 'http://127.0.0.1:3100/account/callback',
    COGNITO_GOOGLE: 'true',
  });
  if (!config) {
    throw new Error('expected cognito config');
  }
  return config;
}

function signer(): { jwk: JsonWebKey & { kid?: string }; sign: (claims: Record<string, unknown>) => string } {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = publicKey.export({ format: 'jwk' }) as JsonWebKey & { kid?: string };
  jwk.kid = 'key-1';
  return {
    jwk,
    sign(claims) {
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'key-1' }), 'utf8').toString('base64url');
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

describe('google sign-in cases', () => {
  it('reads Google from any identity and splits a full name into a profile', () => {
    const config = configured();
    const keys = signer();
    const linked = verifyIdToken(
      keys.sign(claims({ identities: [{ providerName: 'Cognito', userId: 'native-subject' }, { providerName: 'Google', userId: 'google-subject-1' }] })),
      config,
      { keys: [keys.jwk] },
      nonce,
    );
    assert.equal(linked?.provider, 'google');
    assert.equal(linked?.providerSubject, 'google-subject-1');
    const unverified = readIdToken(keys.sign(claims({ email_verified: false })), config, { keys: [keys.jwk] }, nonce);
    assert.equal(unverified.ok, false);
    if (!unverified.ok) {
      assert.equal(unverified.reason, 'email-unverified');
    }
    const google = verifyIdToken(
      keys.sign(claims({ email_verified: false, identities: [{ providerName: 'Google', userId: 'google-subject-1' }] })),
      config,
      { keys: [keys.jwk] },
      nonce,
    );
    assert.equal(google?.provider, 'google');
    assert.equal(google?.emailVerified, true);
    const verified = verifyIdToken(
      keys.sign(claims({ given_name: '', family_name: '', name: 'Ada Lovelace', locale: 'pt-BR', picture: 'https://lh3.googleusercontent.com/a/ada' })),
      config,
      { keys: [keys.jwk] },
      nonce,
    );
    assert.ok(verified);
    const draft = verifiedSignInFromClaims(verified, undefined, undefined);
    assert.equal(draft?.givenName, 'Ada');
    assert.equal(draft?.familyName, 'Lovelace');
    assert.equal(draft?.displayName, 'Ada Lovelace');
    assert.equal(draft?.locale, 'pt-BR');
    const picture = `https://lh3.googleusercontent.com/a/${'a'.repeat(1600)}`;
    assert.ok(picture.length > 500 && picture.length <= 2048);
    const longPicture = verifyIdToken(keys.sign(claims({ picture })), config, { keys: [keys.jwk] }, nonce);
    assert.equal(longPicture?.pictureUrl, picture);
    const cutOff = `https://lh3.googleusercontent.com/a/${'b'.repeat(2100)}`;
    const dropped = verifyIdToken(keys.sign(claims({ picture: cutOff })), config, { keys: [keys.jwk] }, nonce);
    assert.equal(dropped?.pictureUrl, '');
    assert.equal(draft?.username, '');
    assert.equal(draft ? usernameForSignIn(draft.username, draft.email, ['ada'], []) : '', 'ada-1');
    const single = verifyIdToken(keys.sign(claims({ given_name: '', family_name: '', name: 'Cher' })), config, { keys: [keys.jwk] }, nonce);
    assert.ok(single);
    assert.equal(verifiedSignInFromClaims(single as IdClaims, undefined, undefined), undefined);
  });

  it('retries a linked email once and refuses a picture from another host', async () => {
    assert.deepEqual(hostedCallbackDecision({ error: 'access_denied', description: '', stateMatches: true, alreadyRetried: false }), {
      kind: 'notice',
      notice: 'google-cancelled',
    });
    assert.deepEqual(
      hostedCallbackDecision({
        error: 'invalid_request',
        description: 'An account with the given email already exists.',
        stateMatches: true,
        alreadyRetried: false,
      }),
      { kind: 'retry-google' },
    );
    assert.deepEqual(
      hostedCallbackDecision({
        error: 'invalid_request',
        description: 'PreSignUp failed with error ACCOUNT_LINKED.',
        stateMatches: true,
        alreadyRetried: true,
      }),
      { kind: 'notice', notice: 'email-unconfirmed' },
    );
    assert.deepEqual(hostedCallbackDecision({ error: '', description: '', stateMatches: false, alreadyRetried: false }), {
      kind: 'notice',
      notice: 'sign-in-expired',
    });
    assert.equal(hostedCallbackDecision({ error: '', description: '', stateMatches: true, alreadyRetried: false }).kind, 'continue');
    const redirectUri = 'http://127.0.0.1:3100/account/callback';
    assert.equal(browserAccountOrigin(redirectUri, 'localhost:3100'), 'http://127.0.0.1:3100');
    assert.equal(googleStartRedirect(redirectUri, '127.0.0.1:3100', ''), undefined);
    assert.equal(googleStartRedirect(redirectUri, 'localhost:3100', '?next=%2Fshop'), 'http://127.0.0.1:3100/account/google?next=%2Fshop');
    assert.equal(noticeForAccountError('account is disabled'), 'account-disabled');
    assert.equal(noticeForAccountError('provider subject belongs to another profile'), 'account-conflict');
    assert.equal(googlePictureUrl('https://lh3.googleusercontent.com/a/ada'), 'https://lh3.googleusercontent.com/a/ada');
    assert.equal(googlePictureUrl('http://lh3.googleusercontent.com/a/ada'), undefined);
    assert.equal(googlePictureUrl('https://evil.example/a.png'), undefined);
    assert.equal(googlePictureUrl('https://lh3.ggpht.com/a/ada'), undefined);
    const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]);
    const saved = await readGooglePicture('https://lh3.googleusercontent.com/a/ada', async (input) => {
      if (String(input).includes('evil')) {
        return new Response(png, { status: 200 });
      }
      return new Response(null, { status: 302, headers: { location: 'https://evil.example/a.png' } });
    });
    assert.equal(saved, undefined);
    const direct = await readGooglePicture('https://lh3.googleusercontent.com/a/ada', async () => new Response(png, { status: 200 }));
    assert.equal(direct?.length, png.length);
    const followed = await readGooglePicture('https://lh3.googleusercontent.com/a/ada', async (input) => {
      if (String(input) === 'https://lh3.googleusercontent.com/a/ada') {
        return new Response(null, { status: 302, headers: { location: 'https://lh3.ggpht.com/a/ada' } });
      }
      if (String(input) === 'https://lh3.ggpht.com/a/ada') {
        return new Response(png, { status: 200 });
      }
      return new Response(null, { status: 404 });
    });
    assert.equal(followed?.length, png.length);
    const taken = await registerWithCognito({ email: 'ada@example.com', password: 'Long-secret-1' }, target, async () => ({
      ok: false,
      status: 400,
      json: async () => ({ __type: 'UsernameExistsException' }),
    }));
    assert.equal(taken.notice, 'email-taken');
  });

  it('stores a Google photo with the session created for that sign-in', () => {
    const callback = readFileSync(new URL('../app/account/callback/route.ts', import.meta.url), 'utf8');
    const avatar = readFileSync(new URL('../src/account/google-avatar.ts', import.meta.url), 'utf8');
    const remote = readFileSync(new URL('../src/remote-store.ts', import.meta.url), 'utf8');
    const actions = readFileSync(new URL('../src/account/actions.ts', import.meta.url), 'utf8');
    const callbackBody = callback.slice(callback.indexOf('const sub = await establishVerifiedAccount'));
    const profile = actions.slice(
      actions.indexOf('export async function completeProfileAction'),
      actions.indexOf('export async function requestPasswordResetAction'),
    );
    assert.equal(callbackBody.includes('const sessionToken = createSessionToken(sub)'), true);
    assert.equal(
      callbackBody.indexOf('const sessionToken = createSessionToken(sub)') <
        callbackBody.indexOf('storeGooglePicture(sub, claims.pictureUrl, undefined, sessionToken)'),
      true,
    );
    assert.equal(avatar.includes("callPrivate('save-avatar', { sub, avatarBase64: Buffer.from(bytes).toString('base64') }, sessionToken)"), true);
    assert.equal(remote.includes('const session = sessionToken || jar.get(sessionCookieName)?.value'), true);
    assert.equal(
      profile.indexOf('const sessionToken = await remember(admitted)') <
        profile.indexOf('storeGooglePicture(admitted, claims.pictureUrl, undefined, sessionToken)'),
      true,
    );
  });
});
