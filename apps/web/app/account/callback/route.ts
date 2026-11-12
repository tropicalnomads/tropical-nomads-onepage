import { cookies } from 'next/headers';
import { normalizeAccountEmail, usernameForSignIn } from 'tropical-nomads-shared';
import {
  exchangeAuthCode,
  fetchJwks,
  hostedCallbackDecision,
  noticeForAccountError,
  browserAccountOrigin,
  readCognitoConfig,
  readIdToken,
  verifiedSignInFromClaims,
  type PendingNames,
} from '../../../src/account/cognito';
import { establishVerifiedAccount } from '../../../src/account/establish';
import { storeGooglePicture } from '../../../src/account/google-avatar';
import { beginHostedSignIn, hostedCookieClear, hostedCookies } from '../../../src/account/hosted-flow';
import { clearReturnPath, readReturnPath } from '../../../src/account/return-cookie';
import { profileSetupHref, signInHref } from '../../../src/account/return-path';
import { createSessionToken, openPayload, sealPayload, sessionCookieMaxAge, sessionCookieName } from '../../../src/account/session';
import type { AccountNotice } from '../../../src/i18n/copy';
import { loadSnapshot } from '../../../src/remote-store';
import { withNoindex } from '../../../src/seo/headers.ts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function redirect(url: URL): Response {
  return withNoindex(Response.redirect(url));
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

function noticeLocation(origin: string, next: string | undefined, notice: AccountNotice): URL {
  const url = new URL(signInHref(next), origin);
  url.searchParams.set('notice', notice);
  return url;
}

export async function GET(request: Request): Promise<Response> {
  const config = readCognitoConfig();
  const here = new URL(request.url);
  const origin = browserAccountOrigin(config?.redirectUri, request.headers.get('host'));
  if (!config) {
    return redirect(new URL('/account/sign-in', origin));
  }
  const jar = await cookies();
  const alreadyRetried = jar.get(hostedCookies.retry)?.value === '1';
  const state = text(openPayload(jar.get(hostedCookies.state)?.value));
  const verifier = text(openPayload(jar.get(hostedCookies.verifier)?.value));
  const nonce = text(openPayload(jar.get(hostedCookies.nonce)?.value));
  const pending = namesFrom(openPayload(jar.get(hostedCookies.pending)?.value));
  const clear = hostedCookieClear();
  jar.delete({ name: hostedCookies.state, ...clear });
  jar.delete({ name: hostedCookies.verifier, ...clear });
  jar.delete({ name: hostedCookies.pending, ...clear });
  jar.delete({ name: hostedCookies.nonce, ...clear });
  const decision = hostedCallbackDecision({
    error: here.searchParams.get('error') ?? '',
    description: here.searchParams.get('error_description') ?? '',
    stateMatches: Boolean(state && state === here.searchParams.get('state') && verifier && nonce),
    alreadyRetried,
  });
  const next = await readReturnPath();
  switch (decision.kind) {
    case 'retry-google': {
      const url = await beginHostedSignIn({ provider: 'google', retry: true });
      if (!url) {
        jar.delete({ name: hostedCookies.retry, ...clear });
        return redirect(noticeLocation(origin, next, 'google-failed'));
      }
      return redirect(new URL(url));
    }
    case 'notice':
      jar.delete({ name: hostedCookies.retry, ...clear });
      return redirect(noticeLocation(origin, next, decision.notice));
    case 'continue':
      break;
    default: {
      const unexpected: never = decision;
      return unexpected;
    }
  }
  if (!verifier || !nonce) {
    jar.delete({ name: hostedCookies.retry, ...clear });
    return redirect(noticeLocation(origin, next, 'sign-in-expired'));
  }
  const code = here.searchParams.get('code') ?? '';
  const token = await exchangeAuthCode(config, code, verifier);
  const jwks = token ? await fetchJwks(config) : undefined;
  const read = token && jwks ? readIdToken(token, config, jwks, nonce) : { ok: false as const, reason: 'invalid' as const };
  if (!read.ok) {
    jar.delete({ name: hostedCookies.retry, ...clear });
    const notice = read.reason === 'email-unverified' ? 'google-email-unverified' : 'google-failed';
    return redirect(noticeLocation(origin, next, notice));
  }
  const claims = read.claims;
  const snapshot = await loadSnapshot();
  const email = normalizeAccountEmail(claims.email);
  const existing =
    snapshot.accounts.profiles.find((profile) => profile.sub === claims.sub) ??
    snapshot.accounts.profiles.find((profile) => profile.emailVerified && normalizeAccountEmail(profile.email) === email);
  const draft = verifiedSignInFromClaims(
    claims,
    pending,
    existing ? { username: existing.username, givenName: existing.givenName, familyName: existing.familyName } : undefined,
  );
  jar.set(hostedCookies.verified, sealPayload(claims, 600), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/account',
    maxAge: 600,
  });
  if (!draft) {
    jar.delete({ name: hostedCookies.retry, ...clear });
    return redirect(new URL(profileSetupHref(next), origin));
  }
  const verified = {
    ...draft,
    username: usernameForSignIn(
      draft.username,
      draft.email,
      snapshot.accounts.profiles.map((profile) => profile.username),
      snapshot.eventIds,
    ),
  };
  try {
    const sub = await establishVerifiedAccount(verified);
    const sessionToken = createSessionToken(sub);
    jar.set(sessionCookieName, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: sessionCookieMaxAge,
    });
    if (!existing?.avatarKey && claims.pictureUrl) {
      await storeGooglePicture(sub, claims.pictureUrl, undefined, sessionToken);
    }
    jar.delete({ name: hostedCookies.verified, ...clear });
    jar.delete({ name: hostedCookies.retry, ...clear });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const notice = noticeForAccountError(message) ?? 'google-failed';
    if (notice === 'name-required') {
      return redirect(new URL(profileSetupHref(next), origin));
    }
    jar.delete({ name: hostedCookies.verified, ...clear });
    jar.delete({ name: hostedCookies.retry, ...clear });
    return redirect(noticeLocation(origin, next, notice));
  }
  await clearReturnPath();
  return redirect(new URL(next ?? '/', origin));
}
