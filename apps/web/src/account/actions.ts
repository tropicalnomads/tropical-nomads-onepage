'use server';

import { cookies } from 'next/headers';
import { publishedEventIds, readAccounts, saveAvatarFile, saveProfileDetails, updateAccounts } from 'tropical-nomads-api/accounts';
import { normalizeAccountEmail, usernameFromEmail, type VerifiedSignIn } from 'tropical-nomads-shared';
import type { AccountNotice } from '../i18n/copy';
import {
  cognitoTarget,
  confirmForgotPasswordWithCognito,
  confirmSignUpWithCognito,
  forgotPasswordWithCognito,
  pendingNames,
  registerWithCognito,
  resendConfirmationWithCognito,
  signInWithCognito,
  verifiedSignInFromClaims,
  type IdClaims,
} from './cognito';
import { clearVerifiedClaims, readVerifiedClaims, rememberVerifiedClaims } from './cognito-actions';
import { establishVerifiedAccount } from './establish';
import { readProfileAvatar, readProfileDetails } from './profile';
import { accountEmail, pendingEmailCookie, reviewConfirmationCode, reviewEmail, reviewPasswordSignIn, reviewProvider, reviewRegistration } from './review';
import { createSessionToken, readSessionSub, sessionCookieName } from './session';

export interface AccountActionResult {
  notice?: AccountNotice;
  redirect?: '/account' | '/account/sign-in' | '/account/profile' | '/account/confirm';
  email?: string;
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

export async function registerAction(formData: FormData): Promise<AccountActionResult> {
  const password = field(formData, 'password');
  const email = field(formData, 'email');
  const notice = reviewRegistration({ email, password, confirmPassword: field(formData, 'confirmPassword') });
  if (notice) {
    return { notice };
  }
  const target = cognitoTarget();
  if (!target) {
    return { notice: 'cognito-not-configured' };
  }
  const created = await registerWithCognito({ email, password }, target);
  if (!created.sub) {
    if (created.notice === 'email-unconfirmed') {
      const pending = accountEmail(email);
      if (!pending) {
        return { notice: 'email-invalid' };
      }
      await rememberPendingEmail(pending);
      return { redirect: '/account/confirm', email: pending };
    }
    return { notice: created.notice };
  }
  const signedIn = await signInWithCognito(normalizeAccountEmail(email), password, target);
  if (!signedIn.claims) {
    if (signedIn.notice === 'email-unconfirmed') {
      const pending = accountEmail(email);
      if (pending) {
        await rememberPendingEmail(pending);
        return { redirect: '/account/confirm', email: pending };
      }
    }
    return { notice: signedIn.notice ?? 'email-unconfirmed' };
  }
  return holdForProfile(signedIn.claims);
}

export async function confirmRegistrationAction(formData: FormData): Promise<AccountActionResult> {
  const email = accountEmail(field(formData, 'email'));
  const code = field(formData, 'code');
  if (!email) {
    return { notice: 'email-invalid' };
  }
  const notice = reviewConfirmationCode(code);
  if (notice) {
    return { notice };
  }
  const target = cognitoTarget();
  if (!target) {
    return { notice: 'cognito-not-configured' };
  }
  const confirmed = await confirmSignUpWithCognito(email, code, target);
  if (confirmed.notice) {
    return { notice: confirmed.notice };
  }
  await clearPendingEmail();
  return { redirect: '/account/sign-in', notice: 'account-confirmed', email };
}

export async function rememberConfirmationEmailAction(formData: FormData): Promise<AccountActionResult> {
  const email = accountEmail(field(formData, 'email'));
  if (!email) {
    return { notice: 'email-invalid' };
  }
  await rememberPendingEmail(email);
  return { redirect: '/account/confirm', email };
}

export async function resendConfirmationAction(formData: FormData): Promise<AccountActionResult> {
  const email = accountEmail(field(formData, 'email'));
  if (!email) {
    return { notice: 'email-invalid' };
  }
  const target = cognitoTarget();
  if (!target) {
    return { notice: 'cognito-not-configured' };
  }
  return resendConfirmationWithCognito(email, target);
}

export async function completeProfileAction(formData: FormData): Promise<AccountActionResult> {
  const parsed = await readProfileDetails(formData);
  if (!parsed.details || parsed.notice) {
    return { notice: parsed.notice ?? 'profile-invalid' };
  }
  const claims = await readVerifiedClaims();
  if (!claims) {
    return { notice: 'not-signed-in' };
  }
  const accounts = readAccounts();
  const username = usernameFromEmail(
    claims.email,
    accounts.profiles.map((profile) => profile.username),
    publishedEventIds(),
  );
  const profile = verifiedSignInFromClaims(
    claims,
    pendingNames({ username, givenName: parsed.details.givenName, familyName: parsed.details.familyName }),
    undefined,
  );
  if (!profile) {
    return { notice: 'name-required' };
  }
  const admitted = await admit(profile);
  if (typeof admitted !== 'string') {
    return { notice: admitted };
  }
  const bytes = await readProfileAvatar(formData);
  const now = new Date().toISOString();
  try {
    await updateAccounts((current) => {
      const withDetails = saveProfileDetails(current, admitted, parsed.details!, now);
      return bytes ? saveAvatarFile(withDetails, admitted, bytes, now) : withDetails;
    });
  } catch {
    return { notice: bytes ? 'avatar-rejected' : 'profile-invalid' };
  }
  await remember(admitted);
  await clearVerifiedClaims();
  return { redirect: '/account' };
}

export async function requestPasswordResetAction(formData: FormData): Promise<AccountActionResult> {
  const email = field(formData, 'email');
  const notice = reviewEmail(email);
  if (notice) {
    return { notice };
  }
  const target = cognitoTarget();
  if (!target) {
    return { notice: 'cognito-not-configured' };
  }
  return forgotPasswordWithCognito(normalizeAccountEmail(email), target);
}

export async function confirmPasswordResetAction(formData: FormData): Promise<AccountActionResult> {
  const email = field(formData, 'email');
  const password = field(formData, 'password');
  const code = field(formData, 'code');
  const notice = (password === field(formData, 'confirmPassword') ? undefined : 'password-mismatch')
    ?? reviewPasswordSignIn(email, password)
    ?? reviewConfirmationCode(code);
  if (notice) {
    return { notice };
  }
  const target = cognitoTarget();
  if (!target) {
    return { notice: 'cognito-not-configured' };
  }
  const reset = await confirmForgotPasswordWithCognito(normalizeAccountEmail(email), code, password, target);
  if (reset.notice) {
    return { notice: reset.notice };
  }
  return { redirect: '/account/sign-in', notice: 'password-reset' };
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
  if (!signedIn.claims) {
    if (signedIn.notice === 'email-unconfirmed') {
      const pending = accountEmail(email);
      if (pending) {
        await rememberPendingEmail(pending);
        return { redirect: '/account/confirm', email: pending, notice: 'email-unconfirmed' };
      }
    }
    return { notice: signedIn.notice ?? 'password-rejected' };
  }
  if (normalizeAccountEmail(signedIn.claims.email) !== normalizeAccountEmail(email)) {
    return { notice: 'password-rejected' };
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
    return holdForProfile(signedIn.claims);
  }
  const admitted = await admit(profile);
  if (typeof admitted !== 'string') {
    return { notice: admitted };
  }
  await remember(admitted);
  return { redirect: '/account' };
}

async function holdForProfile(claims: IdClaims): Promise<AccountActionResult> {
  await rememberVerifiedClaims(claims);
  return { redirect: '/account/profile' };
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

async function rememberPendingEmail(email: string): Promise<void> {
  const jar = await cookies();
  jar.set(pendingEmailCookie, email, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/account',
    maxAge: 60 * 60 * 24,
  });
}

async function clearPendingEmail(): Promise<void> {
  const jar = await cookies();
  jar.set(pendingEmailCookie, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/account',
    maxAge: 0,
  });
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
