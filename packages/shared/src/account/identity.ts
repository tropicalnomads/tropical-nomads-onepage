import { configuredAdminId, roleForNewAccount } from '../access/matrix.ts';
import { normalizeLocale } from '../constants/locales.ts';
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
  displayName?: string;
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

export function passwordChecks(password: string): {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  symbol: boolean;
} {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
}

export function passwordProblem(password: string, username: string, email: string): string | undefined {
  if (password.length < 8) {
    return 'password is too short';
  }
  if (password.length > 128) {
    return 'password is too long';
  }
  const checks = passwordChecks(password);
  if (!checks.uppercase) {
    return 'password needs an uppercase letter';
  }
  if (!checks.lowercase) {
    return 'password needs a lowercase letter';
  }
  if (!checks.number) {
    return 'password needs a number';
  }
  if (!checks.symbol) {
    return 'password needs a symbol';
  }
  const lower = password.toLowerCase();
  if ((username !== '' && lower === username.toLowerCase()) || (email !== '' && lower === normalizeAccountEmail(email))) {
    return 'password is not allowed';
  }
  return undefined;
}

export function splitPersonName(input: { givenName: string; familyName: string; fullName: string }): { givenName: string; familyName: string } {
  const givenName = clean(input.givenName).slice(0, 80);
  const familyName = clean(input.familyName).slice(0, 80);
  if (givenName !== '' && familyName !== '') {
    return { givenName, familyName };
  }
  const fullName = clean(input.fullName).slice(0, 160);
  const space = fullName.lastIndexOf(' ');
  if (fullName === '' || space <= 0) {
    return { givenName: givenName || fullName.slice(0, 80), familyName };
  }
  return {
    givenName: (givenName || fullName.slice(0, space)).trim().slice(0, 80),
    familyName: (familyName || fullName.slice(space + 1)).trim().slice(0, 80),
  };
}

export function usernameForSignIn(requested: string, email: string, existing: readonly string[], eventIds: readonly string[] = []): string {
  const trimmed = clean(requested);
  if (trimmed !== '' && !usernameProblem(trimmed, existing, eventIds)) {
    return trimmed;
  }
  return usernameFromEmail(email, existing, eventIds);
}

export function usernameFromEmail(email: string, existing: readonly string[], eventIds: readonly string[] = []): string {
  const local = normalizeAccountEmail(email).split('@')[0] ?? '';
  const letters = local.replace(/[^A-Za-z0-9_-]/g, '');
  let base = /^[A-Za-z]/.test(letters) ? letters : `m${letters}`;
  base = base.slice(0, 20);
  if (base.length < 3) {
    base = `${base}nomad`.slice(0, 24);
  }
  for (let suffix = 0; suffix < 100; suffix += 1) {
    const candidate = suffix === 0 ? base : `${base.slice(0, 18)}-${suffix}`;
    if (!usernameProblem(candidate, existing, eventIds)) {
      return candidate;
    }
  }
  return 'member';
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
  const givenName = clean(signIn.givenName).slice(0, 80);
  const familyName = clean(signIn.familyName).slice(0, 80);
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
    if (current.status === 'disabled') {
      return fail('account is disabled');
    }
    let nextEmail = current.email;
    if (!sameText(current.email, email)) {
      if (!byProvider || byProvider.sub !== current.sub) {
        return fail('provider subject belongs to another profile');
      }
      const taken = profiles.some((profile) => profile.sub !== current.sub && sameText(profile.email, email));
      if (taken) {
        return fail('provider subject belongs to another profile');
      }
      nextEmail = email;
    }
    const providers = current.providers.some((link) => link.provider === signIn.provider && link.subject === providerSubject)
      ? current.providers
      : [...current.providers, { provider: signIn.provider, subject: providerSubject }];
    const updated: Profile = { ...current, email: nextEmail, emailVerified: true, providers, updatedAt: now };
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
  const locale = normalizeLocale(signIn.locale);
  const requestedDisplayName = clean(signIn.displayName ?? '');
  const combinedName = `${givenName} ${familyName}`.trim();
  const draft = {
    sub,
    email,
    emailVerified: true,
    username: clean(signIn.username),
    givenName,
    familyName,
    displayName: (requestedDisplayName || combinedName || givenName).slice(0, 80),
    providers: [{ provider: signIn.provider, subject: providerSubject }],
    createdAt: now,
    updatedAt: now,
    status: 'active',
    role: adminSub !== undefined && adminSub === sub ? 'admin' : roleForNewAccount(),
    ...(locale ? { locale } : {}),
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
