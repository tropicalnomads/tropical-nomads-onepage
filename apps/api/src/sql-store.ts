import pg from 'pg';
import { databaseSettings, databaseTls, type DatabaseSettings } from './database.ts';

const { Pool } = pg;

type Queryable = {
  query: (text: string, values?: readonly unknown[]) => Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>;
};

let pool: InstanceType<typeof Pool> | undefined;
let writeTail: Promise<void> = Promise.resolve();

/** Serializes account and operational writes so a sale cannot interleave with another. */
export function queueDatabase<T>(work: () => Promise<T>): Promise<T> {
  const run = writeTail.then(work, work);
  writeTail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function requireSettings(): DatabaseSettings {
  const settings = databaseSettings();
  if (!settings) {
    throw new Error('database settings are incomplete');
  }
  return settings;
}

function db(): Queryable {
  const settings = requireSettings();
  if (!pool) {
    pool = new Pool({
      host: settings.host,
      port: settings.port,
      user: settings.user,
      password: settings.password,
      database: settings.database,
      ssl: databaseTls(),
      max: 4,
    });
  }
  return pool;
}

async function withTransaction<T>(work: (client: Queryable) => Promise<T>): Promise<T> {
  const client = await (db() as InstanceType<typeof Pool>).connect();
  try {
    await client.query('begin');
    const result = await work(client);
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

function documents(rows: Record<string, unknown>[]): unknown[] {
  return rows.map((row) => row.document);
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} is not a record`);
  }
  return value as Record<string, unknown>;
}

function text(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' ? value : null;
}

function requiredText(record: Record<string, unknown>, key: string, label: string): string {
  const value = text(record, key);
  if (value === null || value.trim() === '') {
    throw new Error(`${label} is missing ${key}`);
  }
  return value;
}

const catalogTables = {
  events: 'party',
  artists: 'artist',
  venues: 'venue',
  partners: 'partner',
  labels: 'label',
  agencies: 'agency',
  socials: 'social_link',
} as const;

export type StoredCatalog = keyof typeof catalogTables;

const catalogKeys = {
  events: 'events',
  artists: 'artists',
  venues: 'venues',
  partners: 'partners',
  labels: 'labels',
  agencies: 'agencies',
} as const;

export async function readStoredCatalog(name: StoredCatalog): Promise<unknown> {
  const table = catalogTables[name];
  const rows = await db().query(`select document from ${table} order by source_order, id`);
  const records = documents(rows.rows);
  if (name === 'socials') {
    return records;
  }
  const envelope = await db().query('select document from catalog_envelope where name = $1', [name]);
  const meta = envelope.rows[0]?.document;
  if (typeof meta !== 'object' || meta === null || Array.isArray(meta)) {
    throw new Error('catalog envelope is missing');
  }
  return { ...meta, count: records.length, [catalogKeys[name]]: records };
}

export interface StoredAccounts {
  schemaVersion: 1;
  profiles: unknown[];
  billingAddresses: unknown[];
  paymentMethods: unknown[];
}

export async function readStoredAccounts(): Promise<StoredAccounts> {
  const profiles = await db().query('select document from profile order by sub');
  const addresses = await db().query('select document from billing_address order by id');
  const methods = await db().query('select document from payment_method order by id');
  return {
    schemaVersion: 1,
    profiles: documents(profiles.rows),
    billingAddresses: documents(addresses.rows),
    paymentMethods: documents(methods.rows),
  };
}

export async function writeStoredAccounts(file: StoredAccounts, existing?: Queryable): Promise<void> {
  const run = async (client: Queryable): Promise<void> => {
    await client.query('delete from payment_method');
    await client.query('delete from profile');
    await client.query('delete from billing_address');
    for (const input of file.billingAddresses) {
      const address = asRecord(input, 'billing address');
      await client.query(
        `insert into billing_address (id, recipient_name, line1, line2, city, region, postal_code, country, document)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
        [
          requiredText(address, 'id', 'billing address'),
          requiredText(address, 'recipientName', 'billing address'),
          requiredText(address, 'line1', 'billing address'),
          text(address, 'line2'),
          requiredText(address, 'city', 'billing address'),
          requiredText(address, 'region', 'billing address'),
          requiredText(address, 'postalCode', 'billing address'),
          requiredText(address, 'country', 'billing address'),
          JSON.stringify(address),
        ],
      );
    }
    for (const input of file.profiles) {
      const profile = asRecord(input, 'profile');
      await client.query(
        `insert into profile (
          sub, email, email_verified, username, given_name, family_name, display_name, avatar_key, phone,
          city, region, postal_code, country, created_at, updated_at, status, role, locale, billing_address_id, document
        ) values (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20::jsonb
        )`,
        [
          requiredText(profile, 'sub', 'profile'),
          requiredText(profile, 'email', 'profile'),
          profile.emailVerified === true,
          requiredText(profile, 'username', 'profile'),
          requiredText(profile, 'givenName', 'profile'),
          requiredText(profile, 'familyName', 'profile'),
          text(profile, 'displayName'),
          text(profile, 'avatarKey'),
          text(profile, 'phone'),
          text(profile, 'city'),
          text(profile, 'region'),
          text(profile, 'postalCode'),
          text(profile, 'country'),
          requiredText(profile, 'createdAt', 'profile'),
          requiredText(profile, 'updatedAt', 'profile'),
          requiredText(profile, 'status', 'profile'),
          requiredText(profile, 'role', 'profile'),
          text(profile, 'locale'),
          text(profile, 'billingAddressId'),
          JSON.stringify(profile),
        ],
      );
      if (!Array.isArray(profile.providers)) {
        throw new Error('profile is missing providers');
      }
      for (const linkInput of profile.providers) {
        const link = asRecord(linkInput, 'provider');
        await client.query('insert into profile_provider (profile_sub, provider, subject) values ($1, $2, $3)', [
          requiredText(profile, 'sub', 'profile'),
          requiredText(link, 'provider', 'provider'),
          requiredText(link, 'subject', 'provider'),
        ]);
      }
    }
    for (const input of file.paymentMethods) {
      const method = asRecord(input, 'payment method');
      await client.query(
        `insert into payment_method (
          id, user_id, type, provider_customer_reference, provider_method_reference, brand, last4,
          expiry_month, expiry_year, billing_address_id, status, document
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)`,
        [
          requiredText(method, 'id', 'payment method'),
          requiredText(method, 'userId', 'payment method'),
          requiredText(method, 'type', 'payment method'),
          requiredText(method, 'providerCustomerReference', 'payment method'),
          requiredText(method, 'providerMethodReference', 'payment method'),
          requiredText(method, 'brand', 'payment method'),
          requiredText(method, 'last4', 'payment method'),
          method.expiryMonth,
          method.expiryYear,
          requiredText(method, 'billingAddressId', 'payment method'),
          requiredText(method, 'status', 'payment method'),
          JSON.stringify(method),
        ],
      );
    }
  };
  if (existing) {
    await run(existing);
    return;
  }
  await withTransaction(run);
}

export interface StoredCollection {
  schemaVersion: 1;
  records: unknown[];
}

const collectionTables = {
  orders: 'customer_order',
  'payment-traces': 'payment_trace',
  'issued-tickets': 'issued_ticket',
  'check-ins': 'check_in',
  'door-invites': 'door_invite',
  'guest-lists': 'guest_list',
  'stock-counts': 'stock_count',
} as const;

export type StoredCollectionName = keyof typeof collectionTables;

export async function readStoredCollection(name: StoredCollectionName): Promise<StoredCollection> {
  if (name === 'stock-counts') {
    const rows = await db().query('select product_id, size, count from stock_count order by product_id, size');
    return {
      schemaVersion: 1,
      records: rows.rows.map((row) => ({ productId: row.product_id, size: row.size, count: Number(row.count) })),
    };
  }
  const table = collectionTables[name];
  const rows = await db().query(`select document from ${table} order by id`);
  return { schemaVersion: 1, records: documents(rows.rows) };
}

export async function writeStoredCollection(name: StoredCollectionName, file: StoredCollection, existing?: Queryable): Promise<void> {
  const run = async (client: Queryable): Promise<void> => {
    if (name === 'stock-counts') {
      await client.query('delete from stock_count');
      for (const input of file.records) {
        const row = asRecord(input, 'stock');
        await client.query('insert into stock_count (product_id, size, count) values ($1, $2, $3)', [
          requiredText(row, 'productId', 'stock'),
          requiredText(row, 'size', 'stock'),
          row.count,
        ]);
      }
      return;
    }
    const table = collectionTables[name];
    await client.query(`delete from ${table}`);
    for (const input of file.records) {
      await insertCollectionRow(client, name, input);
    }
  };
  if (existing) {
    await run(existing);
    return;
  }
  await withTransaction(run);
}

export async function writeStoredState(state: {
  accounts?: StoredAccounts;
  collections?: Partial<Record<StoredCollectionName, StoredCollection>>;
}): Promise<void> {
  await withTransaction(async (client) => {
    if (state.accounts) {
      await writeStoredAccounts(state.accounts, client);
    }
    const collections = state.collections;
    if (!collections) {
      return;
    }
    const names = Object.keys(collectionTables) as StoredCollectionName[];
    for (const name of names) {
      const file = collections[name];
      if (file) {
        await writeStoredCollection(name, file, client);
      }
    }
  });
}

async function insertCollectionRow(client: Queryable, name: Exclude<StoredCollectionName, 'stock-counts'>, input: unknown): Promise<void> {
  const record = asRecord(input, name);
  const document = JSON.stringify(record);
  switch (name) {
    case 'orders':
      await client.query(
        `insert into customer_order (id, user_id, purpose, lines, trace_id, created_at, document)
         values ($1, $2, $3, $4::jsonb, $5, $6, $7::jsonb)`,
        [
          requiredText(record, 'id', name),
          requiredText(record, 'userId', name),
          requiredText(record, 'purpose', name),
          JSON.stringify(record.lines ?? []),
          requiredText(record, 'traceId', name),
          requiredText(record, 'createdAt', name),
          document,
        ],
      );
      return;
    case 'payment-traces':
      await client.query(
        `insert into payment_trace (id, user_id, amount, currency, purpose, reference, status, document)
         values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
        [
          requiredText(record, 'id', name),
          requiredText(record, 'userId', name),
          record.amount,
          requiredText(record, 'currency', name),
          requiredText(record, 'purpose', name),
          requiredText(record, 'reference', name),
          requiredText(record, 'status', name),
          document,
        ],
      );
      return;
    case 'issued-tickets':
      await client.query(
        `insert into issued_ticket (id, party_id, trace_id, buyer_id, secret, created_at, valid_for_entry, document)
         values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
        [
          requiredText(record, 'id', name),
          requiredText(record, 'partyId', name),
          requiredText(record, 'traceId', name),
          requiredText(record, 'buyerId', name),
          requiredText(record, 'secret', name),
          requiredText(record, 'createdAt', name),
          record.validForEntry === true,
          document,
        ],
      );
      return;
    case 'check-ins':
      await client.query(
        `insert into check_in (id, ticket_id, guest_id, party_id, at, actor_id, result, reason, document)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
        [
          requiredText(record, 'id', name),
          text(record, 'ticketId'),
          text(record, 'guestId'),
          requiredText(record, 'partyId', name),
          requiredText(record, 'at', name),
          requiredText(record, 'actorId', name),
          requiredText(record, 'result', name),
          text(record, 'reason'),
          document,
        ],
      );
      return;
    case 'door-invites':
      await client.query(
        `insert into door_invite (id, email, user_id, party_ids, revoked, document)
         values ($1, $2, $3, $4, $5, $6::jsonb)`,
        [
          requiredText(record, 'id', name),
          requiredText(record, 'email', name),
          text(record, 'userId'),
          Array.isArray(record.partyIds) ? record.partyIds : [],
          record.revoked === true,
          document,
        ],
      );
      return;
    case 'guest-lists':
      await client.query(
        `insert into guest_list (id, party_id, name, created_at, guests, document)
         values ($1, $2, $3, $4, $5::jsonb, $6::jsonb)`,
        [
          requiredText(record, 'id', name),
          requiredText(record, 'partyId', name),
          requiredText(record, 'name', name),
          requiredText(record, 'createdAt', name),
          JSON.stringify(record.guests ?? []),
          document,
        ],
      );
      return;
    default: {
      const unexpected: never = name;
      throw new Error(unexpected);
    }
  }
}

export async function readStoredProducts(): Promise<unknown[]> {
  const products = await db().query('select id, document from product order by id');
  const stock = await db().query('select product_id, size, count from stock_count order by product_id, size');
  return products.rows.map((row) => {
    const document = asRecord(row.document, 'product');
    const sizes = stock.rows
      .filter((item) => item.product_id === row.id)
      .map((item) => ({ code: item.size, count: Number(item.count) }));
    return { ...document, stock: sizes };
  });
}

export async function writeStoredAvatar(key: string, bytes: Uint8Array): Promise<void> {
  await db().query('insert into avatar (key, bytes) values ($1, $2) on conflict (key) do update set bytes = excluded.bytes', [key, Buffer.from(bytes)]);
}

export async function readStoredAvatar(key: string): Promise<Uint8Array | undefined> {
  const rows = await db().query('select bytes from avatar where key = $1', [key]);
  const bytes = rows.rows[0]?.bytes;
  if (!Buffer.isBuffer(bytes)) {
    return undefined;
  }
  return new Uint8Array(bytes);
}
