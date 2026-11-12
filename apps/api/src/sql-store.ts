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

export type StoredQuery = Queryable;

export function runInTransaction<T>(work: (client: StoredQuery) => Promise<T>): Promise<T> {
  return withTransaction(work);
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

/** Column wins when it is a string array, including an empty list. Null leaves the stored document unchanged. */
export function publishedPartyDocument(document: unknown, headliners: unknown): unknown {
  if (!Array.isArray(headliners) || headliners.some((item) => typeof item !== 'string')) {
    return document;
  }
  if (typeof document !== 'object' || document === null || Array.isArray(document)) {
    return document;
  }
  return { ...document, headliners };
}

export function storedHeadlinersJson(value: unknown): string | null {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    return null;
  }
  return JSON.stringify(value);
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
  const rows = await db().query(
    name === 'events'
      ? `select document, headliners from party where publication = 'published' order by source_order, id`
      : `select document from ${table} order by source_order, id`,
  );
  const records =
    name === 'events' ? rows.rows.map((row) => publishedPartyDocument(row.document, row.headliners)) : documents(rows.rows);
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
        `insert into issued_ticket (id, party_id, trace_id, buyer_id, secret, secret_box, created_at, valid_for_entry, document)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
        [
          requiredText(record, 'id', name),
          requiredText(record, 'partyId', name),
          requiredText(record, 'traceId', name),
          requiredText(record, 'buyerId', name),
          requiredText(record, 'secret', name),
          text(record, 'secretBox'),
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

export async function insertStoredRecord(client: StoredQuery, name: 'orders' | 'payment-traces', record: unknown): Promise<void> {
  await insertCollectionRow(client, name, record);
}

export async function closeStoredDatabase(): Promise<void> {
  if (!pool) {
    return;
  }
  const current = pool;
  pool = undefined;
  await current.end();
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

export async function deleteStoredAvatar(key: string): Promise<void> {
  await db().query('delete from avatar where key = $1', [key]);
}

export async function readStoredAvatar(key: string): Promise<Uint8Array | undefined> {
  const rows = await db().query('select bytes from avatar where key = $1', [key]);
  const bytes = rows.rows[0]?.bytes;
  if (!Buffer.isBuffer(bytes)) {
    return undefined;
  }
  return new Uint8Array(bytes);
}

export interface StoredPartyRow {
  origin: string;
  publication: string;
  revisions: unknown;
  offersManaged: boolean;
  document: unknown;
}

export interface StoredPartyWrite {
  origin: string;
  publication: string;
  revisions: unknown;
  offersManaged: boolean;
  event: Record<string, unknown>;
}

export async function readStoredPartyRows(): Promise<StoredPartyRow[]> {
  const rows = await db().query(
    'select origin, publication, revisions, offers_managed, document, headliners from party order by source_order, id',
  );
  return rows.rows.map((row) => ({
    origin: String(row.origin),
    publication: String(row.publication),
    revisions: row.revisions,
    offersManaged: row.offers_managed === true,
    document: publishedPartyDocument(row.document, row.headliners),
  }));
}

function partyText(event: Record<string, unknown>, key: string): string | null {
  const value = event[key];
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function partyJson(value: unknown): string | null {
  return value === undefined ? null : JSON.stringify(value);
}

export async function upsertStoredParty(party: StoredPartyWrite): Promise<void> {
  const event = party.event;
  const id = requiredText(event, 'id', 'party');
  const venue = asRecord(event.venue ?? {}, 'party venue');
  const offers = partyJson(event.offers);
  const document = JSON.stringify(event);
  await withTransaction(async (client) => {
    const order = await client.query('select coalesce(max(source_order), 0) + 1 as next from party');
    const sourceOrder = Number(order.rows[0]?.next ?? 1);
    await client.query(
      `insert into party (
        id, title, type, date_start, date_end, timezone, duration_hours, venue_id, venue, lineup_raw,
        stages, card_artists, headliners, partner_ids, timetable_festival_id, media, description, organizer, images,
        links, source, offers, document, source_order, origin, publication, revisions, offers_managed
      ) values (
        $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10,
        $11::jsonb, $12::jsonb, $13::jsonb, $14, $15, $16::jsonb, $17, $18, $19::jsonb,
        $20::jsonb, $21::jsonb, $22::jsonb, $23::jsonb, $24, $25, $26, $27::jsonb, $28
      )
      on conflict (id) do update set
        title = excluded.title,
        type = excluded.type,
        date_start = excluded.date_start,
        date_end = excluded.date_end,
        timezone = excluded.timezone,
        duration_hours = excluded.duration_hours,
        venue_id = excluded.venue_id,
        venue = excluded.venue,
        lineup_raw = excluded.lineup_raw,
        stages = excluded.stages,
        card_artists = excluded.card_artists,
        headliners = excluded.headliners,
        partner_ids = excluded.partner_ids,
        timetable_festival_id = excluded.timetable_festival_id,
        media = excluded.media,
        description = excluded.description,
        organizer = excluded.organizer,
        images = excluded.images,
        links = excluded.links,
        source = excluded.source,
        offers = excluded.offers,
        document = excluded.document,
        origin = excluded.origin,
        publication = excluded.publication,
        revisions = excluded.revisions,
        offers_managed = excluded.offers_managed`,
      [
        id,
        requiredText(event, 'title', 'party'),
        partyText(event, 'type'),
        requiredText(event, 'dateStart', 'party'),
        partyText(event, 'dateEnd'),
        partyText(event, 'timezone'),
        typeof event.durationHours === 'number' ? event.durationHours : null,
        partyText(venue, 'id'),
        partyJson(event.venue),
        partyText(event, 'lineupRaw'),
        partyJson(event.stages),
        partyJson(event.cardArtists),
        storedHeadlinersJson(event.headliners),
        Array.isArray(event.partnerIds) ? event.partnerIds : [],
        partyText(event, 'timetableFestivalId'),
        partyJson(event.media),
        partyText(event, 'description'),
        partyText(event, 'organizer'),
        partyJson(event.images),
        partyJson(event.links ?? {}),
        partyJson(event.source),
        offers,
        document,
        sourceOrder,
        party.origin,
        party.publication,
        JSON.stringify(party.revisions ?? []),
        party.offersManaged,
      ],
    );
  });
}

export async function readStoredVenueDocuments(): Promise<unknown[]> {
  const rows = await db().query('select document from venue order by source_order, id');
  return documents(rows.rows);
}

export async function upsertStoredVenue(document: Record<string, unknown>): Promise<void> {
  const id = requiredText(document, 'id', 'venue');
  await withTransaction(async (client) => {
    const order = await client.query('select coalesce(max(source_order), 0) + 1 as next from venue');
    const sourceOrder = Number(order.rows[0]?.next ?? 1);
    await client.query(
      `insert into venue (id, name, city, country, iso_country, address, geo, map_url, document, source_order)
       values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9::jsonb, $10)
       on conflict (id) do update set
         name = excluded.name,
         city = excluded.city,
         country = excluded.country,
         iso_country = excluded.iso_country,
         address = excluded.address,
         geo = excluded.geo,
         map_url = excluded.map_url,
         document = excluded.document`,
      [
        id,
        text(document, 'name'),
        text(document, 'city'),
        text(document, 'country'),
        text(document, 'isoCountry'),
        text(document, 'address'),
        document.geo === undefined ? null : JSON.stringify(document.geo),
        text(document, 'mapUrl'),
        JSON.stringify(document),
        sourceOrder,
      ],
    );
  });
}

export async function readStoredArtist(id: string): Promise<Record<string, unknown> | undefined> {
  const rows = await db().query('select document from artist where id = $1', [id]);
  const document = rows.rows[0]?.document;
  if (typeof document !== 'object' || document === null || Array.isArray(document)) {
    return undefined;
  }
  return document as Record<string, unknown>;
}

export async function upsertStoredArtist(document: Record<string, unknown>): Promise<void> {
  const id = requiredText(document, 'id', 'artist');
  const name = requiredText(document, 'name', 'artist');
  await withTransaction(async (client) => {
    const order = await client.query('select coalesce(max(source_order), 0) + 1 as next from artist');
    const sourceOrder = Number(order.rows[0]?.next ?? 1);
    await client.query(
      `insert into artist (id, name, country, iso_country, country_flag, genres, agencies, labels, stage, document, source_order)
       values ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9, $10::jsonb, $11)
       on conflict (id) do update set
         name = excluded.name,
         country = excluded.country,
         iso_country = excluded.iso_country,
         country_flag = excluded.country_flag,
         genres = excluded.genres,
         document = excluded.document`,
      [
        id,
        name,
        text(document, 'country'),
        text(document, 'isoCountry'),
        text(document, 'countryFlag'),
        JSON.stringify(document.genres ?? []),
        document.agencies === undefined ? null : JSON.stringify(document.agencies),
        document.labels === undefined ? null : JSON.stringify(document.labels),
        text(document, 'stage'),
        JSON.stringify(document),
        sourceOrder,
      ],
    );
  });
}
