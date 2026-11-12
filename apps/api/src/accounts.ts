import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import {
  attachVerifiedSignIn,
  avatarByteLimit,
  containsCardNumber,
  parseBillingAddress,
  parsePaymentMethod,
  parseProfile,
  parseProfiles,
  usernameProblem,
  type BillingAddress,
  type PaymentMethod,
  type Profile,
  type VerifiedSignIn,
} from 'tropical-nomads-shared';
import { readPartyCatalog } from './catalog.ts';
import { usingDatabase } from './database.ts';
import { operationalDirectory } from './operational.ts';
import { assertNoPrivateFields } from './published.ts';
import { deleteStoredAvatar, queueDatabase, readStoredAccounts, readStoredAvatar, readStoredCatalog, writeStoredAccounts, writeStoredAvatar } from './sql-store.ts';

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
  return operationalDirectory();
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

export async function loadAccounts(root?: string): Promise<AccountFile> {
  if (usingDatabase(root)) {
    return assertAccountFile(await readStoredAccounts());
  }
  return readAccounts(root ?? accountRoot());
}

export async function loadPublishedEventIds(): Promise<string[]> {
  if (!usingDatabase()) {
    return publishedEventIds();
  }
  const catalog = await readStoredCatalog('events');
  if (typeof catalog !== 'object' || catalog === null || Array.isArray(catalog)) {
    throw new Error('events catalog is not the published envelope');
  }
  const events = (catalog as { events?: unknown }).events;
  if (!Array.isArray(events)) {
    throw new Error('events catalog is not the published envelope');
  }
  return events.flatMap((event) => {
    if (typeof event !== 'object' || event === null || Array.isArray(event)) {
      return [];
    }
    const id = (event as { id?: unknown }).id;
    return typeof id === 'string' && id.trim() !== '' ? [id] : [];
  });
}

export async function loadAvatar(key: string, root?: string): Promise<Uint8Array | undefined> {
  if (!/^avatars\/[a-f0-9]{16,}\.(?:jpg|png|webp)$/.test(key)) {
    return undefined;
  }
  if (usingDatabase(root)) {
    const bytes = await readStoredAvatar(key);
    return bytes !== undefined && inspectAvatar(bytes) ? bytes : undefined;
  }
  return readAvatar(key, root ?? accountRoot());
}

export async function storeAvatarBytes(bytes: Uint8Array): Promise<string> {
  if (!usingDatabase()) {
    return storeAvatar(bytes);
  }
  const ext = inspectAvatar(bytes);
  if (!ext) {
    throw new Error('avatar is not an image');
  }
  const key = `avatars/${randomBytes(16).toString('hex')}.${ext}`;
  await writeStoredAvatar(key, bytes);
  return key;
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

export interface ProfileDetails {
  givenName: string;
  familyName: string;
  displayName?: string;
  phone?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
}

const optionalProfileFields = ['displayName', 'phone', 'city', 'region', 'postalCode', 'country'] as const;

export function saveProfileDetails(file: AccountFile, sub: string, input: ProfileDetails, now: string): AccountFile {
  const current = file.profiles.find((profile) => profile.sub === sub);
  if (!current || current.status !== 'active') {
    throw new Error('profile is not active');
  }
  const updated: Profile = {
    ...current,
    givenName: input.givenName,
    familyName: input.familyName,
    updatedAt: now,
  };
  for (const key of optionalProfileFields) {
    const value = input[key];
    if (value) {
      updated[key] = value;
    } else {
      delete updated[key];
    }
  }
  const parsed = parseProfile(updated, { billingAddressIds: file.billingAddresses.map((address) => address.id) });
  if (!parsed.ok) {
    throw new Error(parsed.errors[0] ?? 'profile was not saved');
  }
  const profiles = file.profiles.map((profile) => (profile.sub === sub ? parsed.value : profile));
  return assertAccountFile({ ...file, profiles });
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

export function inspectAvatar(bytes: Uint8Array): 'jpg' | 'png' | 'webp' | undefined {
  if (bytes.length < 12 || bytes.length > avatarByteLimit) {
    return undefined;
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpg';
  }
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'png';
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'webp';
  }
  return undefined;
}

function avatarDirectory(root: string): string {
  const directory = resolve(root);
  if (directory.includes(`${sep}public${sep}`) || directory.endsWith(`${sep}public`)) {
    throw new Error('avatar is not an image');
  }
  return resolve(directory, 'avatars');
}

export function storeAvatar(bytes: Uint8Array, root = accountRoot()): string {
  const ext = inspectAvatar(bytes);
  if (!ext) {
    throw new Error('avatar is not an image');
  }
  const id = randomBytes(16).toString('hex');
  const key = `avatars/${id}.${ext}`;
  const directory = avatarDirectory(root);
  const filePath = resolve(directory, `${id}.${ext}`);
  if (!filePath.startsWith(`${directory}${sep}`)) {
    throw new Error('avatar is not an image');
  }
  mkdirSync(directory, { recursive: true });
  writeFileSync(filePath, bytes);
  return key;
}

export function readAvatar(key: string, root = accountRoot()): Uint8Array | undefined {
  if (!/^avatars\/[a-f0-9]{16,}\.(?:jpg|png|webp)$/.test(key)) {
    return undefined;
  }
  const directory = avatarDirectory(root);
  const filePath = resolve(root, key);
  if (!filePath.startsWith(`${directory}${sep}`)) {
    return undefined;
  }
  try {
    const bytes = new Uint8Array(readFileSync(filePath));
    return inspectAvatar(bytes) ? bytes : undefined;
  } catch {
    return undefined;
  }
}

export function saveAvatarFile(file: AccountFile, sub: string, bytes: Uint8Array, now: string, root = accountRoot()): AccountFile {
  const profile = file.profiles.find((item) => item.sub === sub);
  if (!profile || profile.status !== 'active') {
    throw new Error('profile is not active');
  }
  const key = storeAvatar(bytes, root);
  return saveAvatarKey(file, sub, key, now);
}

const storedAvatarKey = /^avatars\/[a-z0-9-]{16,}\.(?:jpg|png|webp)$/;

export async function removeAvatar(key: string, root?: string): Promise<void> {
  if (!storedAvatarKey.test(key)) {
    return;
  }
  if (usingDatabase(root)) {
    await deleteStoredAvatar(key);
    return;
  }
  const directory = root ?? accountRoot();
  const folder = avatarDirectory(directory);
  const filePath = resolve(directory, key);
  if (!filePath.startsWith(`${folder}${sep}`)) {
    return;
  }
  try {
    unlinkSync(filePath);
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
      return;
    }
    throw new Error('account was not deleted');
  }
}

export function saveAvatarKey(file: AccountFile, sub: string, avatarKey: string, now: string): AccountFile {
  const profile = file.profiles.find((item) => item.sub === sub);
  if (!profile || profile.status !== 'active') {
    throw new Error('profile is not active');
  }
  if (!storedAvatarKey.test(avatarKey)) {
    throw new Error('avatar key is not valid');
  }
  const profiles = file.profiles.map((item) => (item.sub === sub ? { ...item, avatarKey, updatedAt: now } : item));
  return assertAccountFile({ ...file, profiles });
}

export function updateAccounts(change: (current: AccountFile) => AccountFile, root?: string): Promise<AccountFile> {
  if (usingDatabase(root)) {
    return queueDatabase(async () => {
      const next = assertAccountFile(change(await loadAccounts()));
      await writeStoredAccounts(next);
      return loadAccounts();
    });
  }
  const directory = root ?? accountRoot();
  return queueWriter(async () => {
    const next = change(readAccounts(directory));
    writeAccounts(next, directory);
    return readAccounts(directory);
  });
}
