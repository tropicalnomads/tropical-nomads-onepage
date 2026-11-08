'use server';

import { cookies } from 'next/headers';
import { publishedEventIds, readAccounts } from 'tropical-nomads-api/accounts';
import { normalizeAccountEmail, type VerifiedSignIn } from 'tropical-nomads-shared';
import type { AccountNotice } from '../i18n/copy';
import { cognitoTarget, registerWithCognito, signInWithCognito, verifiedSignInFromClaims } from './cognito';
import { establishVerifiedAccount } from './establish';
import { reviewPasswordSignIn, reviewProvider, reviewRegistration } from './review';
import { createSessionToken, readSessionSub, sessionCookieName } from './session';

export interface AccountActionResult {
  notice?: AccountNotice;
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

export async function registerAction(formData: FormData): Promise<AccountActionResult> {
  const password = field(formData, 'password');
  const notice = reviewRegistration(
    {
      email: field(formData, 'email'),
      username: field(formData, 'username'),
      givenName: field(formData, 'givenName'),
      familyName: field(formData, 'familyName'),
      password,
    },
    readAccounts().profiles.map((profile) => profile.username),
    publishedEventIds(),
  );
  if (notice) {
    return { notice };
  }
  const target = cognitoTarget();
  if (!target) {
    return { notice: 'cognito-not-configured' };
  }
  const created = await registerWithCognito(
    {
      email: field(formData, 'email'),
      username: field(formData, 'username'),
      password,
      givenName: field(formData, 'givenName'),
      familyName: field(formData, 'familyName'),
    },
    target,
  );
  if (!created.sub) {
    return { notice: created.notice };
  }
  const admitted = await admit({
    sub: created.sub,
    provider: 'cognito',
    providerSubject: created.sub,
    email: field(formData, 'email'),
    emailVerified: true,
    username: field(formData, 'username'),
    givenName: field(formData, 'givenName'),
    familyName: field(formData, 'familyName'),
  });
  if (typeof admitted !== 'string') {
    return { notice: admitted };
  }
  await remember(admitted);
  return {};
}

export async function signInAction(formData: FormData): Promise<AccountActionResult> {
  const email = field(formData, 'email');
  const password = field(formData, 'password');
  const notice = reviewPasswordSignIn(email, password);
  if (notice) {
    return { notice };
  }
  const target = cognitoTarget();
  if (!target) {
    return { notice: 'cognito-not-configured' };
  }
  const signedIn = await signInWithCognito(email, password, target);
  if (!signedIn.claims || normalizeAccountEmail(signedIn.claims.email) !== normalizeAccountEmail(email)) {
    return { notice: signedIn.notice ?? 'password-rejected' };
  }
  const existing = readAccounts().profiles.find(
    (profile) => profile.sub === signedIn.claims?.sub || normalizeAccountEmail(profile.email) === normalizeAccountEmail(signedIn.claims?.email ?? ''),
  );
  const profile = verifiedSignInFromClaims(
    signedIn.claims,
    undefined,
    existing ? { username: existing.username, givenName: existing.givenName, familyName: existing.familyName } : undefined,
  );
  if (!profile) {
    return { notice: 'username-required' };
  }
  const admitted = await admit(profile);
  if (typeof admitted !== 'string') {
    return { notice: admitted };
  }
  await remember(admitted);
  return {};
}

async function admit(signIn: VerifiedSignIn): Promise<string | AccountNotice> {
  try {
    return await establishVerifiedAccount(signIn);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    switch (message) {
      case 'username is taken':
        return 'username-taken';
      case 'username is not valid':
      case 'username is required':
        return 'username-invalid';
      case 'name is required':
        return 'name-required';
      default:
        return 'password-rejected';
    }
  }
}

async function remember(sub: string): Promise<void> {
  const jar = await cookies();
  jar.set(sessionCookieName, createSessionToken(sub), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export async function providerAction(formData: FormData): Promise<AccountActionResult> {
  return { notice: reviewProvider(field(formData, 'provider')) };
}

export async function signOutAction(): Promise<void> {
  const jar = await cookies();
  jar.delete(sessionCookieName);
}

export async function currentAccountSub(): Promise<string | undefined> {
  const jar = await cookies();
  return readSessionSub(jar.get(sessionCookieName)?.value);
}
