import { cookies } from 'next/headers';
import { currentAccounts } from '../../../src/remote-store';
import { normalizeAccountEmail } from 'tropical-nomads-shared';
import {
  exchangeAuthCode,
  fetchJwks,
  readCognitoConfig,
  verifiedSignInFromClaims,
  verifyIdToken,
  type PendingNames,
} from '../../../src/account/cognito';
import { establishVerifiedAccount } from '../../../src/account/establish';
import { createSessionToken, openPayload, sealPayload, sessionCookieMaxAge, sessionCookieName } from '../../../src/account/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const stateCookie = 'tn:cognito:state';
const verifierCookie = 'tn:cognito:verifier';
const nonceCookie = 'tn:cognito:nonce';
const pendingCookie = 'tn:cognito:pending';
const verifiedCookie = 'tn:cognito:verified';

function oauthClear() {
  return { path: '/account' };
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined;
}

function namesFrom(value: unknown): PendingNames | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  const record = value as Partial<PendingNames>;
  if (typeof record.username !== 'string' || typeof record.givenName !== 'string' || typeof record.familyName !== 'string') {
    return undefined;
  }
  return { username: record.username, givenName: record.givenName, familyName: record.familyName };
}

export async function GET(request: Request): Promise<Response> {
  const config = readCognitoConfig();
  const here = new URL(request.url);
  const signIn = new URL('/account/sign-in', here.origin);
  if (!config) {
    return Response.redirect(signIn);
  }
  const jar = await cookies();
  const state = text(openPayload(jar.get(stateCookie)?.value));
  const verifier = text(openPayload(jar.get(verifierCookie)?.value));
  const nonce = text(openPayload(jar.get(nonceCookie)?.value));
  const pending = namesFrom(openPayload(jar.get(pendingCookie)?.value));
  jar.delete({ name: stateCookie, ...oauthClear() });
  jar.delete({ name: verifierCookie, ...oauthClear() });
  jar.delete({ name: pendingCookie, ...oauthClear() });
  jar.delete({ name: nonceCookie, ...oauthClear() });
  if (here.searchParams.get('error') || !state || state !== here.searchParams.get('state') || !verifier || !nonce) {
    return Response.redirect(signIn);
  }
  const code = here.searchParams.get('code') ?? '';
  const token = await exchangeAuthCode(config, code, verifier);
  const jwks = token ? await fetchJwks(config) : undefined;
  const claims = token && jwks ? verifyIdToken(token, config, jwks, nonce) : undefined;
  if (!claims) {
    return Response.redirect(signIn);
  }
  const email = normalizeAccountEmail(claims.email);
  const existing = (await currentAccounts()).profiles.find((profile) => profile.sub === claims.sub || normalizeAccountEmail(profile.email) === email);
  const verified = verifiedSignInFromClaims(
    claims,
    pending,
    existing ? { username: existing.username, givenName: existing.givenName, familyName: existing.familyName } : undefined,
  );
  if (!verified) {
    jar.set(verifiedCookie, sealPayload(claims, 600), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/account',
      maxAge: 600,
    });
    return Response.redirect(new URL('/account/register', here.origin));
  }
  try {
    const sub = await establishVerifiedAccount(verified);
    jar.set(sessionCookieName, createSessionToken(sub), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: sessionCookieMaxAge,
    });
    jar.delete({ name: verifiedCookie, ...oauthClear() });
  } catch {
    return Response.redirect(signIn);
  }
  return Response.redirect(new URL('/account', here.origin));
}
