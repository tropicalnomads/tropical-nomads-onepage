'use server';

import { cookies } from 'next/headers';
import { publishedEventIds, readAccounts } from 'tropical-nomads-api/accounts';
import type { AccountNotice } from '../i18n/copy';
import { reviewPasswordSignIn, reviewProvider, reviewRegistration } from './review';
import { readSessionSub, sessionCookieName } from './session';

export interface AccountActionResult {
  notice: AccountNotice;
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
  return { notice: notice ?? 'cognito-not-configured' };
}

export async function signInAction(formData: FormData): Promise<AccountActionResult> {
  const notice = reviewPasswordSignIn(field(formData, 'email'), field(formData, 'password'));
  return { notice: notice ?? 'cognito-not-configured' };
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
