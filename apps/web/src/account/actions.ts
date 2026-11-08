'use server';

import { cookies } from 'next/headers';
import { publishedEventIds, readAccounts } from 'tropical-nomads-api/accounts';
import type { AccountNotice } from '../i18n/copy';
import { cognitoTarget, registerWithCognito, signInWithCognito } from './cognito';
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
      password,
      givenName: field(formData, 'givenName'),
      familyName: field(formData, 'familyName'),
    },
    target,
  );
  if (created.sub) {
    await remember(created.sub);
  }
  return { notice: created.notice };
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
  if (!signedIn.sub) {
    return { notice: signedIn.notice ?? 'password-rejected' };
  }
  await remember(signedIn.sub);
  return {};
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
