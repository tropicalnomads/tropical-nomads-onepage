'use server';

import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import type { AccountNotice } from '../i18n/copy';
import { authorizeUrl, pendingNames, readCognitoConfig, verifiedSignInFromClaims, type HostedProvider, type IdClaims } from './cognito';
import { establishVerifiedAccount } from './establish';
import { rememberReturnPath, takeReturnPath } from './return-cookie';
import { createSessionToken, openPayload, sealPayload, sessionCookieMaxAge, sessionCookieName } from './session';

export interface HostedResult {
  notice: AccountNotice;
  redirect?: string;
}

const stateCookie = 'tn:cognito:state';
const verifierCookie = 'tn:cognito:verifier';
const nonceCookie = 'tn:cognito:nonce';
const pendingCookie = 'tn:cognito:pending';
const verifiedCookie = 'tn:cognito:verified';

const blockedFields = new Set(['subject', 'sub', 'userId', 'providerSubject', 'password', 'cardNumber', 'secret']);

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

function oauthCookie() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/account',
    maxAge: 600,
  };
}

function sessionCookie() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: sessionCookieMaxAge,
  };
}

export async function startHostedSignIn(formData: FormData): Promise<HostedResult> {
  for (const key of formData.keys()) {
    if (blockedFields.has(key)) {
      return { notice: 'provider-not-allowed' };
    }
  }
  const config = readCognitoConfig();
  if (!config) {
    return { notice: 'cognito-not-configured' };
  }
  const provider = hostedProvider(field(formData, 'provider'));
  if (!provider) {
    return { notice: 'provider-not-allowed' };
  }
  const state = randomBytes(24).toString('base64url');
  const nonce = randomBytes(24).toString('base64url');
  const verifier = randomBytes(32).toString('base64url');
  const redirect = authorizeUrl(config, { provider, state, nonce, verifier });
  if (!redirect) {
    return { notice: 'provider-not-allowed' };
  }
  await rememberReturnPath(field(formData, 'next'));
  const names = pendingNames({
    username: field(formData, 'username'),
    givenName: field(formData, 'givenName'),
    familyName: field(formData, 'familyName'),
  });
  const jar = await cookies();
  const options = oauthCookie();
  jar.set(stateCookie, sealPayload(state, 600), options);
  jar.set(verifierCookie, sealPayload(verifier, 600), options);
  jar.set(nonceCookie, sealPayload(nonce, 600), options);
  if (names) {
    jar.set(pendingCookie, sealPayload(names, 600), options);
  } else {
    jar.delete({ name: pendingCookie, path: '/account' });
  }
  return { notice: 'cognito-not-configured', redirect };
}

export async function finishVerifiedSignIn(formData: FormData): Promise<HostedResult> {
  for (const key of formData.keys()) {
    if (blockedFields.has(key)) {
      return { notice: 'provider-not-allowed' };
    }
  }
  const jar = await cookies();
  const claims = claimsFrom(openPayload(jar.get(verifiedCookie)?.value));
  if (!claims) {
    return { notice: 'cognito-not-configured' };
  }
  const names = pendingNames({
    username: field(formData, 'username'),
    givenName: field(formData, 'givenName') || claims.givenName,
    familyName: field(formData, 'familyName') || claims.familyName,
  });
  const signIn = names ? verifiedSignInFromClaims(claims, names, undefined) : undefined;
  if (!signIn) {
    return { notice: 'username-required' };
  }
  try {
    const sub = await establishVerifiedAccount(signIn);
    jar.set(sessionCookieName, createSessionToken(sub), sessionCookie());
    jar.delete({ name: verifiedCookie, path: '/account' });
    return { notice: 'not-signed-in', redirect: await takeReturnPath(field(formData, 'next')) };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'username is taken') {
      return { notice: 'username-taken' };
    }
    if (message === 'username is not valid' || message === 'username is required') {
      return { notice: 'username-invalid' };
    }
    return { notice: 'provider-not-allowed' };
  }
}

export async function hasVerifiedClaims(): Promise<boolean> {
  return (await readVerifiedClaims()) !== undefined;
}

export async function rememberVerifiedClaims(claims: IdClaims): Promise<void> {
  const jar = await cookies();
  jar.set(verifiedCookie, sealPayload(claims, 1800), { ...oauthCookie(), maxAge: 1800 });
}

export async function readVerifiedClaims(): Promise<IdClaims | undefined> {
  const jar = await cookies();
  return claimsFrom(openPayload(jar.get(verifiedCookie)?.value));
}

export async function clearVerifiedClaims(): Promise<void> {
  const jar = await cookies();
  jar.delete({ name: verifiedCookie, path: '/account' });
}

function hostedProvider(value: string): HostedProvider | undefined {
  switch (value) {
    case '':
    case 'cognito':
      return 'cognito';
    case 'google':
      return 'google';
    case 'apple':
      return 'apple';
    default:
      return undefined;
  }
}

function claimsFrom(value: unknown): IdClaims | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  const record = value as Partial<IdClaims>;
  if (record.emailVerified !== true || typeof record.sub !== 'string' || typeof record.email !== 'string' || typeof record.providerSubject !== 'string') {
    return undefined;
  }
  switch (record.provider) {
    case 'cognito':
    case 'google':
    case 'apple':
      return {
        sub: record.sub,
        email: record.email,
        emailVerified: true,
        givenName: typeof record.givenName === 'string' ? record.givenName : '',
        familyName: typeof record.familyName === 'string' ? record.familyName : '',
        preferredUsername: typeof record.preferredUsername === 'string' ? record.preferredUsername : '',
        provider: record.provider,
        providerSubject: record.providerSubject,
      };
    default:
      return undefined;
  }
}
