import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { authorizeUrl, readCognitoConfig, type HostedProvider, type PendingNames } from './cognito';
import { rememberReturnPath } from './return-cookie';
import { sealPayload } from './session';

export const hostedCookies = {
  state: 'tn_oauth_state',
  verifier: 'tn_oauth_verifier',
  nonce: 'tn_oauth_nonce',
  pending: 'tn_oauth_pending',
  verified: 'tn:cognito:verified',
  retry: 'tn_oauth_retry',
} as const;

const legacyHandshakeCookies = ['tn:cognito:state', 'tn:cognito:verifier', 'tn:cognito:nonce', 'tn:cognito:pending', 'tn:cognito:google-retry'] as const;

function oauthCookie(maxAge = 600) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/account',
    maxAge,
  };
}

export function hostedCookieClear() {
  return { path: '/account' };
}

export async function beginHostedSignIn(input: {
  provider: HostedProvider;
  next?: string;
  pending?: PendingNames;
  retry: boolean;
}): Promise<string | undefined> {
  const config = readCognitoConfig();
  if (!config) {
    return undefined;
  }
  const state = randomBytes(24).toString('base64url');
  const nonce = randomBytes(24).toString('base64url');
  const verifier = randomBytes(32).toString('base64url');
  const redirect = authorizeUrl(config, { provider: input.provider, state, nonce, verifier });
  if (!redirect) {
    return undefined;
  }
  if (!input.retry) {
    await rememberReturnPath(input.next ?? '');
  }
  const jar = await cookies();
  const options = oauthCookie();
  jar.set(hostedCookies.state, sealPayload(state, 600), options);
  jar.set(hostedCookies.verifier, sealPayload(verifier, 600), options);
  jar.set(hostedCookies.nonce, sealPayload(nonce, 600), options);
  if (input.pending) {
    jar.set(hostedCookies.pending, sealPayload(input.pending, 600), options);
  } else {
    jar.delete({ name: hostedCookies.pending, path: '/account' });
  }
  if (input.retry) {
    jar.set(hostedCookies.retry, '1', options);
  } else {
    jar.delete({ name: hostedCookies.retry, path: '/account' });
  }
  for (const name of legacyHandshakeCookies) {
    jar.delete({ name, path: '/account' });
  }
  return redirect;
}
