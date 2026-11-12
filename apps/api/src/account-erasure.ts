import { parseProfile, usernameProblem, type Profile } from 'tropical-nomads-shared';
import { loadAccounts, loadPublishedEventIds, removeAvatar, updateAccounts, type AccountFile } from './accounts.ts';
import { deleteCognitoAccount, type CognitoUserDirectory } from './cognito-admin.ts';
import { updateOperational } from './operational.ts';

/**
 * The profile row stays so orders, tickets, and payment traces keep a valid user id.
 * Names, email, phone, address, photo, and the Google subject are removed.
 * A later sign-in with the same Google account creates a new profile.
 */

export interface ErasedPersonalData {
  file: AccountFile;
  previousEmail: string;
  email: string;
  avatarKey?: string;
}

export interface AccountErasureOptions {
  root?: string;
  env?: Record<string, string | undefined>;
  directory?: CognitoUserDirectory;
  eventIds?: readonly string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function compactSubject(sub: string): string {
  const compact = sub.replace(/[^a-z0-9]/gi, '').toLowerCase();
  return compact === '' ? 'account' : compact;
}

function tombstoneEmail(sub: string, taken: readonly string[]): string {
  const local = `d${compactSubject(sub).slice(0, 48)}`;
  const used = new Set(taken.map((email) => email.toLowerCase()));
  const first = `${local}@deleted.invalid`;
  if (!used.has(first)) {
    return first;
  }
  for (let index = 2; index < 100; index += 1) {
    const candidate = `${local}${index}@deleted.invalid`;
    if (!used.has(candidate)) {
      return candidate;
    }
  }
  throw new Error('account was not deleted');
}

function tombstoneUsername(sub: string, taken: readonly string[], eventIds: readonly string[]): string {
  const body = compactSubject(sub).slice(0, 23);
  const first = `d${body}`.slice(0, 24);
  if (!usernameProblem(first, taken, eventIds)) {
    return first;
  }
  for (let index = 2; index < 100; index += 1) {
    const suffix = String(index);
    const candidate = `d${body.slice(0, Math.max(0, 23 - suffix.length))}${suffix}`.slice(0, 24);
    if (!usernameProblem(candidate, taken, eventIds)) {
      return candidate;
    }
  }
  throw new Error('account was not deleted');
}

function tombstoneProfile(profile: Profile, email: string, username: string, now: string): Profile {
  const parsed = parseProfile({
    sub: profile.sub,
    email,
    emailVerified: false,
    username,
    givenName: 'Deleted',
    familyName: 'Account',
    providers: [{ provider: 'cognito', subject: profile.sub }],
    createdAt: profile.createdAt,
    updatedAt: now,
    status: 'disabled',
    role: 'user',
  });
  if (!parsed.ok) {
    throw new Error('account was not deleted');
  }
  return parsed.value;
}

export function erasePersonalData(file: AccountFile, sub: string, now: string, eventIds: readonly string[] = []): ErasedPersonalData {
  const profile = file.profiles.find((item) => item.sub === sub);
  if (!profile) {
    throw new Error('account was not deleted');
  }
  const others = file.profiles.filter((item) => item.sub !== sub);
  const email = tombstoneEmail(
    sub,
    others.map((item) => item.email),
  );
  const username = tombstoneUsername(
    sub,
    others.map((item) => item.username),
    eventIds,
  );
  const nextProfile = tombstoneProfile(profile, email, username, now);
  const ownedAddresses = new Set<string>();
  if (profile.billingAddressId) {
    ownedAddresses.add(profile.billingAddressId);
  }
  for (const method of file.paymentMethods) {
    if (method.userId === sub) {
      ownedAddresses.add(method.billingAddressId);
    }
  }
  const paymentMethods = file.paymentMethods.filter((method) => method.userId !== sub);
  const profiles = file.profiles.map((item) => (item.sub === sub ? nextProfile : item));
  const billingAddresses = file.billingAddresses.filter((address) => {
    if (!ownedAddresses.has(address.id)) {
      return true;
    }
    const usedByProfile = profiles.some((item) => item.sub !== sub && item.billingAddressId === address.id);
    const usedByMethod = paymentMethods.some((method) => method.billingAddressId === address.id);
    return usedByProfile || usedByMethod;
  });
  return {
    file: { schemaVersion: 1, profiles, billingAddresses, paymentMethods },
    previousEmail: profile.email,
    email,
    ...(profile.avatarKey ? { avatarKey: profile.avatarKey } : {}),
  };
}

export function stripOrderDelivery(records: readonly unknown[], userId: string): unknown[] {
  return records.map((record) => {
    if (!isRecord(record) || record.userId !== userId || !Object.hasOwn(record, 'delivery')) {
      return record;
    }
    const next: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
      if (key !== 'delivery') {
        next[key] = value;
      }
    }
    return next;
  });
}

export function anonymizeDoorInvites(records: readonly unknown[], userId: string, previousEmail: string, tombstoneEmail: string): unknown[] {
  const email = previousEmail.trim().toLowerCase();
  return records.map((record) => {
    if (!isRecord(record) || typeof record.email !== 'string') {
      return record;
    }
    const matchesUser = record.userId === userId;
    const matchesEmail = email !== '' && record.email.trim().toLowerCase() === email;
    if (!matchesUser && !matchesEmail) {
      return record;
    }
    return { ...record, email: tombstoneEmail };
  });
}

export async function commitAccountErasure(sub: string, now: string, options: AccountErasureOptions = {}): Promise<void> {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(sub)) {
    throw new Error('account was not deleted');
  }
  const accounts = await loadAccounts(options.root);
  if (!accounts.profiles.some((profile) => profile.sub === sub)) {
    throw new Error('account was not deleted');
  }
  await deleteCognitoAccount(sub, options.env ?? process.env, options.directory);
  const eventIds = options.eventIds ?? (options.root ? [] : await loadPublishedEventIds());
  const preview = erasePersonalData(accounts, sub, now, eventIds);
  if (preview.avatarKey) {
    await removeAvatar(preview.avatarKey, options.root);
  }
  await updateOperational(
    'door-invites',
    (current) => ({
      schemaVersion: 1,
      records: anonymizeDoorInvites(current.records, sub, preview.previousEmail, preview.email),
    }),
    options.root,
  );
  await updateOperational(
    'orders',
    (current) => ({
      schemaVersion: 1,
      records: stripOrderDelivery(current.records, sub),
    }),
    options.root,
  );
  await updateAccounts((current) => erasePersonalData(current, sub, now, eventIds).file, options.root);
}
