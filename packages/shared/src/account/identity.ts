import { configuredAdminId, roleForNewAccount } from '../access/matrix.ts';
import { acceptLocale } from '../constants/locales.ts';
import { parseProfile, type Profile } from '../schema/account.ts';
import { containsCardNumber, fail, ok, type ParseResult } from '../schema/result.ts';
import type { SignInProvider } from '../schema/values.ts';

const usernamePattern = /^[A-Za-z][A-Za-z0-9_-]{2,23}$/;

export interface VerifiedSignIn {
  sub: string;
  provider: SignInProvider;
  providerSubject: string;
  email: string;
  emailVerified: boolean;
  username: string;
  givenName: string;
  familyName: string;
  locale?: string;
}

export interface AttachedProfile {
  profiles: readonly Profile[];
  profile: Profile;
}

function clean(value: string): string {
  return value.trim();
}

function sameText(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

export function normalizeAccountEmail(email: string): string {
  return clean(email).toLowerCase();
}

export function usernameProblem(username: string, existing: readonly string[], eventIds: readonly string[] = []): string | undefined {
  const trimmed = clean(username);
  if (trimmed === '') {
    return 'username is required';
  }
  if (!usernamePattern.test(trimmed) || eventIds.some((eventId) => sameText(eventId, trimmed))) {
    return 'username is not valid';
  }
  if (existing.some((taken) => sameText(taken, trimmed))) {
    return 'username is taken';
  }
  return undefined;
}

export function passwordProblem(password: string, username: string, email: string): string | undefined {
  if (password.length < 12) {
    return 'password is too short';
  }
  if (password.length > 128) {
    return 'password is too long';
  }
  const lower = password.toLowerCase();
  if ((username !== '' && lower === username.toLowerCase()) || (email !== '' && lower === normalizeAccountEmail(email))) {
    return 'password is not allowed';
  }
  return undefined;
}

export function accountCanPurchase(profile: Profile): boolean {
  return profile.status === 'active' && profile.role === 'user';
}

export function accountCanScan(profile: Profile): boolean {
  return profile.status === 'active' && profile.role === 'door';
}

export function attachVerifiedSignIn(
  profiles: readonly Profile[],
  signIn: VerifiedSignIn,
  now: string,
  env: { INITIAL_ADMIN_SUB?: string } = {},
  eventIds: readonly string[] = [],
): ParseResult<AttachedProfile> {
  if (signIn.emailVerified !== true) {
    return fail('email is not verified');
  }
  const email = normalizeAccountEmail(signIn.email);
  if (!email.includes('@') || email.startsWith('@') || email.endsWith('@')) {
    return fail('email is not an email');
  }
  const givenName = clean(signIn.givenName);
  const familyName = clean(signIn.familyName);
  if (givenName === '' || familyName === '') {
    return fail('name is required');
  }
  const sub = clean(signIn.sub);
  const providerSubject = clean(signIn.providerSubject);
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(sub) || !/^[A-Za-z0-9:._-]{1,200}$/.test(providerSubject)) {
    return fail('subject is not valid');
  }
  const byProvider = profiles.find((profile) =>
    profile.providers.some((link) => link.provider === signIn.provider && link.subject === providerSubject),
  );
  const byEmail = profiles.find((profile) => profile.emailVerified && sameText(profile.email, email));
  if (byProvider && byEmail && byProvider.sub !== byEmail.sub) {
    return fail('provider subject belongs to another profile');
  }
  const current = byEmail ?? byProvider;
  if (current) {
    if (!sameText(current.email, email)) {
      return fail('provider subject belongs to another profile');
    }
    const providers = current.providers.some((link) => link.provider === signIn.provider && link.subject === providerSubject)
      ? current.providers
      : [...current.providers, { provider: signIn.provider, subject: providerSubject }];
    const updated: Profile = { ...current, providers, updatedAt: now };
    const parsed = parseProfile(updated);
    if (!parsed.ok) {
      return parsed;
    }
    return ok({
      profile: parsed.value,
      profiles: profiles.map((profile) => (profile.sub === current.sub ? parsed.value : profile)),
    });
  }
  const taken = usernameProblem(
    signIn.username,
    profiles.map((profile) => profile.username),
    eventIds,
  );
  if (taken) {
    return fail(taken);
  }
  const adminSub = configuredAdminId(env);
  const locale = signIn.locale === undefined ? undefined : acceptLocale(signIn.locale);
  if (locale && !locale.ok) {
    return fail('locale is not allowed');
  }
  const draft = {
    sub,
    email,
    emailVerified: true,
    username: clean(signIn.username),
    givenName,
    familyName,
    displayName: givenName,
    providers: [{ provider: signIn.provider, subject: providerSubject }],
    createdAt: now,
    updatedAt: now,
    status: 'active',
    role: adminSub !== undefined && adminSub === sub ? 'admin' : roleForNewAccount(),
    ...(locale?.ok ? { locale: locale.locale } : {}),
  };
  if (containsCardNumber(draft)) {
    return fail('card number is not allowed');
  }
  const parsed = parseProfile(draft);
  if (!parsed.ok) {
    return parsed;
  }
  return ok({ profile: parsed.value, profiles: [...profiles, parsed.value] });
}
