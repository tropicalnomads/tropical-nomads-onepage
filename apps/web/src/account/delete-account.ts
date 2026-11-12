'use server';

import { cookies } from 'next/headers';
import { normalizeAccountEmail } from 'tropical-nomads-shared';
import { commitAccountErasure } from 'tropical-nomads-api/account-erasure';
import { apiOrigin } from '../api-origin.ts';
import type { AccountNotice } from '../i18n/copy';
import { callPrivate, currentAccounts } from '../remote-store.ts';
import { pendingEmailCookie } from './review';
import { readSessionSub, sessionCookieName } from './session';

const handshakeCookies = [
  'tn_oauth_state',
  'tn_oauth_verifier',
  'tn_oauth_nonce',
  'tn_oauth_pending',
  'tn_oauth_retry',
  'tn:cognito:verified',
  'tn:cognito:state',
  'tn:cognito:verifier',
  'tn:cognito:nonce',
  'tn:cognito:pending',
  'tn:cognito:google-retry',
  pendingEmailCookie,
] as const;

export interface DeleteAccountResult {
  notice?: AccountNotice;
  redirect?: '/account/sign-in?notice=account-deleted';
}

function sessionCookie() {
  return {
    httpOnly: true as const,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  };
}

async function clearAccountCookies(): Promise<void> {
  const jar = await cookies();
  jar.set(sessionCookieName, '', sessionCookie());
  for (const name of handshakeCookies) {
    jar.delete({ name, path: '/account' });
  }
}

export async function deleteAccountAction(formData: FormData): Promise<DeleteAccountResult> {
  if (formData.get('confirm') !== 'delete') {
    return { notice: 'account-delete-unconfirmed' };
  }
  const typed = formData.get('email');
  const jar = await cookies();
  const sub = readSessionSub(jar.get(sessionCookieName)?.value);
  if (!sub) {
    return { notice: 'not-signed-in' };
  }
  if (typeof typed !== 'string') {
    return { notice: 'account-delete-email' };
  }
  try {
    const accounts = await currentAccounts();
    const profile = accounts.profiles.find((item) => item.sub === sub);
    if (!profile || normalizeAccountEmail(typed) !== normalizeAccountEmail(profile.email)) {
      return { notice: 'account-delete-email' };
    }
    if (apiOrigin()) {
      await callPrivate('delete-account', {});
    } else {
      await commitAccountErasure(sub, new Date().toISOString());
    }
  } catch {
    return { notice: 'account-delete-failed' };
  }
  await clearAccountCookies();
  return { redirect: '/account/sign-in?notice=account-deleted' };
}
