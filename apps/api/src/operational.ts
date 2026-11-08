import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { containsCardNumber, schemas } from 'tropical-nomads-shared';
import { assertNoPrivateFields } from './published.ts';

/**
 * Private JSON for orders, traces, tickets, check-ins, invites, and stock.
 * The place was accepted in ticket 2: `data/operational`, outside `public/`.
 * No secret is stored in the committed files.
 * A cross-process lock waits on the stack. This queue only orders writers inside one process.
 */
export const operationalWriterLock = 'waiting' as const;

export const operationalCollections = {
  orders: 'order',
  'payment-traces': 'paymentTrace',
  'issued-tickets': 'issuedTicket',
  'check-ins': 'checkIn',
  'door-invites': 'doorInvite',
  'stock-counts': 'stockCount',
} as const satisfies Record<string, keyof typeof schemas>;

export type OperationalCollection = keyof typeof operationalCollections;

export interface OperationalFile {
  schemaVersion: 1;
  records: unknown[];
}

export function operationalDirectory(): string {
  const override = process.env.TROPICAL_NOMADS_OPERATIONAL_ROOT?.trim();
  if (override) {
    if (!override.startsWith('/')) {
      throw new Error('operational root is not absolute');
    }
    const directory = resolve(override);
    if (directory.includes(`${sep}public${sep}`) || directory.endsWith(`${sep}public`)) {
      throw new Error('operational root is public');
    }
    if (!existsSync(directory)) {
      throw new Error('operational root is missing');
    }
    return directory;
  }
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

let writerTail: Promise<void> = Promise.resolve();

function queueWriter<T>(work: () => Promise<T>): Promise<T> {
  const run = writerTail.then(work, work);
  writerTail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function collectionPath(name: OperationalCollection, root: string): string {
  if (!Object.hasOwn(operationalCollections, name)) {
    throw new Error('operational collection is unknown');
  }
  const directory = resolve(root);
  const filePath = resolve(directory, `${name}.json`);
  if (!filePath.startsWith(`${directory}${sep}`)) {
    throw new Error('operational path escapes the private store');
  }
  return filePath;
}

function assertOperationalFile(name: OperationalCollection, value: unknown): OperationalFile {
  const fields: readonly string[] = schemas[operationalCollections[name]];
  if (fields.length === 0) {
    throw new Error('operational schema is empty');
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('operational collection is not a file');
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.some((key) => key !== 'schemaVersion' && key !== 'records')) {
    throw new Error('operational collection has an unknown field');
  }
  if (record.schemaVersion !== 1 || !Array.isArray(record.records)) {
    throw new Error('operational collection is not a file');
  }
  assertNoPrivateFields(record);
  if (containsCardNumber(record)) {
    throw new Error('operational collection contains a card number');
  }
  return { schemaVersion: 1, records: record.records };
}

export function readOperational(name: OperationalCollection, root = operationalDirectory()): OperationalFile {
  const filePath = collectionPath(name, root);
  const parsed: unknown = JSON.parse(readFileSync(filePath, 'utf8'));
  return assertOperationalFile(name, parsed);
}

export function writeOperational(name: OperationalCollection, file: OperationalFile, root = operationalDirectory()): void {
  const checked = assertOperationalFile(name, file);
  const filePath = collectionPath(name, root);
  mkdirSync(dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(checked, null, 2)}\n`, 'utf8');
  renameSync(temporary, filePath);
}

export function updateOperational(
  name: OperationalCollection,
  change: (current: OperationalFile) => OperationalFile,
  root = operationalDirectory(),
): Promise<OperationalFile> {
  return queueWriter(async () => {
    const next = change(readOperational(name, root));
    writeOperational(name, next, root);
    return readOperational(name, root);
  });
}

/**
 * The public events file stays as it was. A ticket secret is not copied onto it.
 * Throws when the events file already contains that secret.
 */
export function publishEvents<T>(events: T, secret: string): T {
  if (secret.trim() === '') {
    throw new Error('secret is empty');
  }
  const published = structuredClone(events);
  assertNoPrivateFields(published);
  if (containsCardNumber(published) || containsText(published, secret)) {
    throw new Error('published catalog contains a private field');
  }
  return published;
}

function containsText(value: unknown, text: string): boolean {
  if (typeof value === 'string') {
    return value.includes(text);
  }
  if (Array.isArray(value)) {
    return value.some((item) => containsText(item, text));
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).some((item) => containsText(item, text));
  }
  return false;
}
