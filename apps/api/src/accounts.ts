import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  attachVerifiedSignIn,
  containsCardNumber,
  parseBillingAddress,
  parsePaymentMethod,
  parseProfiles,
  usernameProblem,
  type BillingAddress,
  type PaymentMethod,
  type Profile,
  type VerifiedSignIn,
} from 'tropical-nomads-shared';
import { readPartyCatalog } from './catalog.ts';
import { assertNoPrivateFields } from './published.ts';

export interface AccountFile {
  schemaVersion: 1;
  profiles: Profile[];
  billingAddresses: BillingAddress[];
  paymentMethods: PaymentMethod[];
}

const accountKeys = new Set(['schemaVersion', 'profiles', 'billingAddresses', 'paymentMethods']);

let writerTail: Promise<void> = Promise.resolve();

function queueWriter<T>(work: () => Promise<T>): Promise<T> {
  const run = writerTail.then(work, work);
  writerTail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function accountRoot(): string {
  try {
    const here = typeof import.meta.dirname === 'string' ? import.meta.dirname : dirname(fileURLToPath(import.meta.url));
    const besideApi = resolve(here, '../../../data/operational');
    if (existsSync(besideApi)) {
      return besideApi;
    }
  } catch {
    // The web bundle does not keep this file's directory.
  }
  const fromWeb = resolve(process.cwd(), '../../data/operational');
  if (existsSync(fromWeb)) {
    return fromWeb;
  }
  return resolve(process.cwd(), 'data/operational');
}

function accountPath(root: string): string {
  const directory = resolve(root);
  const filePath = resolve(directory, 'profiles.json');
  if (!filePath.startsWith(`${directory}${sep}`)) {
    throw new Error('account path escapes the private store');
  }
  return filePath;
}

function assertAccountFile(value: unknown): AccountFile {
  assertNoPrivateFields(value);
  if (containsCardNumber(value)) {
    throw new Error('account file contains a card number');
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('account file is not a file');
  }
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => !accountKeys.has(key))) {
    throw new Error('account file has an unknown field');
  }
  if (record.schemaVersion !== 1 || !Array.isArray(record.profiles) || !Array.isArray(record.billingAddresses) || !Array.isArray(record.paymentMethods)) {
    throw new Error('account file is not a file');
  }
  const profiles = parseProfiles(record.profiles);
  if (!profiles.ok) {
    throw new Error('account file is not a file');
  }
  const billingAddresses: BillingAddress[] = [];
  for (const input of record.billingAddresses) {
    const parsed = parseBillingAddress(input);
    if (!parsed.ok) {
      throw new Error('account file is not a file');
    }
    billingAddresses.push(parsed.value);
  }
  const paymentMethods: PaymentMethod[] = [];
  const profileIds = profiles.value.map((profile) => profile.sub);
  const billingAddressIds = billingAddresses.map((address) => address.id);
  for (const input of record.paymentMethods) {
    const parsed = parsePaymentMethod(input, { profileIds, billingAddressIds });
    if (!parsed.ok) {
      throw new Error('account file is not a file');
    }
    paymentMethods.push(parsed.value);
  }
  return {
    schemaVersion: 1,
    profiles: [...profiles.value],
    billingAddresses,
    paymentMethods,
  };
}

export function readAccounts(root = accountRoot()): AccountFile {
  const parsed: unknown = JSON.parse(readFileSync(accountPath(root), 'utf8'));
  return assertAccountFile(parsed);
}

export function writeAccounts(file: AccountFile, root = accountRoot()): void {
  const checked = assertAccountFile(file);
  const filePath = accountPath(root);
  mkdirSync(dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(checked, null, 2)}\n`, 'utf8');
  renameSync(temporary, filePath);
}

export function publishedEventIds(): string[] {
  return readPartyCatalog()
    .events.map((event) => event.id)
    .filter((id) => id.trim() !== '');
}

export function emptyAccounts(): AccountFile {
  return { schemaVersion: 1, profiles: [], billingAddresses: [], paymentMethods: [] };
}

export function registerVerifiedAccount(
  file: AccountFile,
  signIn: VerifiedSignIn,
  eventIds: readonly string[],
  now: string,
  env: { INITIAL_ADMIN_SUB?: string } = {},
): AccountFile {
  const nameProblem = usernameProblem(signIn.username, [], eventIds);
  if (nameProblem === 'username is not valid' || nameProblem === 'username is required') {
    throw new Error(nameProblem);
  }
  const attached = attachVerifiedSignIn(file.profiles, signIn, now, env, eventIds);
  if (!attached.ok) {
    throw new Error(attached.errors[0] ?? 'account was not saved');
  }
  const next = assertAccountFile({ ...file, profiles: attached.value.profiles });
  return next;
}

export function saveDefaultBillingAddress(file: AccountFile, sub: string, input: unknown, now: string): AccountFile {
  const profile = file.profiles.find((item) => item.sub === sub);
  if (!profile || profile.status !== 'active') {
    throw new Error('profile is not active');
  }
  const parsed = parseBillingAddress({ ...(typeof input === 'object' && input !== null ? input : {}), id: `addr-${sub}` });
  if (!parsed.ok) {
    throw new Error(parsed.errors[0] ?? 'billing address was not saved');
  }
  if (parsed.value.id !== `addr-${sub}`) {
    throw new Error('billing address was not saved');
  }
  const billingAddresses = [...file.billingAddresses.filter((address) => address.id !== parsed.value.id), parsed.value];
  const profiles = file.profiles.map((item) => (item.sub === sub ? { ...item, billingAddressId: parsed.value.id, updatedAt: now } : item));
  return assertAccountFile({ ...file, profiles, billingAddresses });
}

export function saveAvatarKey(file: AccountFile, sub: string, avatarKey: string, now: string): AccountFile {
  const profile = file.profiles.find((item) => item.sub === sub);
  if (!profile || profile.status !== 'active') {
    throw new Error('profile is not active');
  }
  if (!/^avatars\/[a-z0-9-]{16,}\.(?:jpg|png|webp)$/.test(avatarKey)) {
    throw new Error('avatar key is not valid');
  }
  const profiles = file.profiles.map((item) => (item.sub === sub ? { ...item, avatarKey, updatedAt: now } : item));
  return assertAccountFile({ ...file, profiles });
}

export function updateAccounts(change: (current: AccountFile) => AccountFile, root = accountRoot()): Promise<AccountFile> {
  return queueWriter(async () => {
    const next = change(readAccounts(root));
    writeAccounts(next, root);
    return readAccounts(root);
  });
}
