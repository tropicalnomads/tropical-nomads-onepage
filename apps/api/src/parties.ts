import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { decideAccess, euroTicketOffers, isPayableAmount, knownTimeZone, readTicketOffers, type Role, type Venue } from 'tropical-nomads-shared';
import type { AccountFile } from './accounts.ts';
import { usingDatabase } from './database.ts';
import { loadCatalogImages } from './s3-load.ts';
import { operationalDirectory } from './operational.ts';
import { readEvents, type PublishedEvent, type PublishedEventImages } from './published.ts';
import { queueDatabase, readStoredPartyRows, upsertStoredParty } from './sql-store.ts';
import { loadVenueCatalog } from './venues.ts';

export interface PartyRevision {
  actorId: string;
  at: string;
}

export type PartyOrigin = 'admin' | 'catalog';
export type PartyPublication = 'draft' | 'published';

export interface ManagedParty {
  id: string;
  origin: PartyOrigin;
  publication: PartyPublication;
  revisions: PartyRevision[];
  offersManaged: boolean;
  event: PublishedEvent;
}

export interface PartyCaller {
  role: Role;
  actorId: string;
}

export type PartyImageAction = 'keep' | 'replace' | 'remove';

export interface PartyOfferInput {
  name: string;
  amount: string;
  capacity: string;
  ticket?: string;
  endsAt?: string;
}

export interface PartySaveInput {
  id?: string;
  title: string;
  dateStart: string;
  dateEnd: string;
  timezone: string;
  venueId: string;
  description: string;
  imageUrl: string;
  imageAction?: PartyImageAction;
  imageBytes?: Uint8Array;
  artists: string;
  headliners?: string;
  offers: PartyOfferInput[];
  publish: boolean;
}

interface CleanParty {
  id?: string;
  title: string;
  dateStart: string;
  dateEnd: string;
  timezone: string;
  venueId: string;
  description: string;
  imageUrl: string;
  imageAction: PartyImageAction;
  artists: string[];
  headliners?: string[];
  offers: { name: string; amount: number; currency: 'EUR'; capacity: number; ticket?: string; endsAt?: string }[];
  publish: boolean;
}

const fileName = 'managed-parties.json';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function newPartyId(): string {
  return `party-${randomBytes(9).toString('hex')}`;
}

function requireAdmin(file: AccountFile, caller: PartyCaller): void {
  const profile = file.profiles.find((item) => item.sub === caller.actorId);
  if (!profile || profile.status !== 'active' || profile.role !== 'admin' || caller.role !== 'admin') {
    throw new Error('party is not allowed');
  }
  const create = decideAccess({ action: 'create-party', role: caller.role, actorId: caller.actorId });
  const configure = decideAccess({ action: 'configure-event-tickets', role: caller.role, actorId: caller.actorId });
  if (create.effect !== 'allow' || configure.effect !== 'allow' || create.actorId !== caller.actorId) {
    throw new Error('party is not allowed');
  }
}

function cleanLine(value: string, max: number, required: boolean): string {
  const text = value.trim();
  if (text === '') {
    if (required) {
      throw new Error('event was not saved');
    }
    return '';
  }
  if (text.length > max || /[\u0000-\u001f]/.test(text)) {
    throw new Error('event was not saved');
  }
  return text;
}

function dateText(value: string, required: boolean): string {
  const text = value.trim();
  if (text === '') {
    if (required) {
      throw new Error('event was not saved');
    }
    return '';
  }
  if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/.test(text) || Number.isNaN(new Date(text).getTime())) {
    throw new Error('event was not saved');
  }
  return text;
}

function httpsUrl(value: string): string {
  const text = value.trim();
  if (text === '') {
    return '';
  }
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw new Error('event was not saved');
  }
  if (url.protocol !== 'https:' || text.length > 500) {
    throw new Error('event was not saved');
  }
  return url.toString();
}

function cleanArtists(value: string): string[] {
  const names = value
    .split(/[\n,]/)
    .map((name) => name.trim())
    .filter((name) => name !== '');
  if (names.length > 40 || names.some((name) => name.length > 80 || /[\u0000-\u001f]/.test(name))) {
    throw new Error('event was not saved');
  }
  return names;
}

function cleanHeadliners(value: string, artists: readonly string[]): string[] {
  const names = value
    .split(/[\n,]/)
    .map((name) => name.trim())
    .filter((name) => name !== '');
  if (names.length > 40 || names.some((name) => name.length > 80 || /[\u0000-\u001f]/.test(name))) {
    throw new Error('event was not saved');
  }
  const seen = new Set<string>();
  const selected: string[] = [];
  for (const name of names) {
    const match = artists.find((artist) => artist.toLowerCase() === name.toLowerCase());
    const key = match?.toLowerCase();
    if (!match || !key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    selected.push(match);
  }
  return selected;
}

function cleanOffers(offers: readonly PartyOfferInput[]): CleanParty['offers'] {
  const selected: CleanParty['offers'] = [];
  const names = new Set<string>();
  for (const offer of offers) {
    const name = offer.name.trim();
    const amountText = offer.amount.trim();
    const capacityText = offer.capacity.trim();
    const ticket = (offer.ticket ?? '').trim();
    const endsAt = (offer.endsAt ?? '').trim();
    if (name === '' && amountText === '' && capacityText === '' && ticket === '' && endsAt === '') {
      continue;
    }
    const amount = Number(amountText);
    const capacity = Number(capacityText);
    if (name === '' || name.length > 80 || /[\u0000-\u001f]/.test(name) || names.has(name) || !isPayableAmount(amount)) {
      throw new Error('event was not saved');
    }
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100000) {
      throw new Error('event was not saved');
    }
    if (ticket.length > 80 || /[\u0000-\u001f]/.test(ticket)) {
      throw new Error('event was not saved');
    }
    if (endsAt !== '' && (Number.isNaN(new Date(endsAt).getTime()) || endsAt.length > 40)) {
      throw new Error('event was not saved');
    }
    names.add(name);
    selected.push({
      name,
      amount,
      currency: 'EUR',
      capacity,
      ...(ticket === '' ? {} : { ticket }),
      ...(endsAt === '' ? {} : { endsAt }),
    });
  }
  if (selected.length > 40) {
    throw new Error('event was not saved');
  }
  return selected;
}

function cleanInput(input: PartySaveInput): CleanParty {
  const id = input.id?.trim() ?? '';
  if (id !== '' && !/^[A-Za-z0-9_-]{1,80}$/.test(id)) {
    throw new Error('event was not saved');
  }
  const timezone = input.timezone.trim();
  if (knownTimeZone(timezone) !== timezone) {
    throw new Error('event was not saved');
  }
  const venueId = input.venueId.trim();
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(venueId)) {
    throw new Error('event was not saved');
  }
  const description = input.description.trim();
  if (description.length > 4000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(description)) {
    throw new Error('event was not saved');
  }
  const artists = cleanArtists(input.artists);
  return {
    ...(id === '' ? {} : { id }),
    title: cleanLine(input.title, 140, true),
    dateStart: dateText(input.dateStart, true),
    dateEnd: dateText(input.dateEnd, false),
    timezone,
    venueId,
    description,
    imageUrl: httpsUrl(input.imageUrl),
    imageAction: input.imageAction ?? 'keep',
    artists,
    ...(typeof input.headliners === 'string' ? { headliners: cleanHeadliners(input.headliners, artists) } : {}),
    offers: cleanOffers(input.offers),
    publish: input.publish,
  };
}

function venueFor(venues: readonly Venue[], id: string): Venue {
  const venue = venues.find((item) => item.id === id);
  if (!venue?.name || !venue.city) {
    throw new Error('event was not saved');
  }
  return { ...venue };
}

function imagesAfter(current: PublishedEventImages | undefined, cleaned: CleanParty, id: string): PublishedEventImages | undefined {
  const images = { ...(current ?? {}) };
  switch (cleaned.imageAction) {
    case 'keep':
      if (cleaned.imageUrl === '') {
        return current;
      }
      return { ...images, full: cleaned.imageUrl };
    case 'replace':
      return { ...images, full: `/events/media/${id}` };
    case 'remove':
      if (typeof images.full === 'string' && images.full.startsWith('/events/media/')) {
        delete images.full;
      }
      return Object.keys(images).length === 0 ? undefined : images;
    default: {
      const unexpected: never = cleaned.imageAction;
      return unexpected;
    }
  }
}

function applyInput(event: PublishedEvent, cleaned: CleanParty, id: string, venues: readonly Venue[]): PublishedEvent {
  const next: PublishedEvent = {
    ...event,
    id,
    title: cleaned.title,
    dateStart: cleaned.dateStart,
    cardArtists: cleaned.artists,
    ...(cleaned.headliners !== undefined ? { headliners: cleaned.headliners } : {}),
    offers: cleaned.offers,
    venue: venueFor(venues, cleaned.venueId),
  };
  if (cleaned.dateEnd === '') {
    delete next.dateEnd;
  } else {
    next.dateEnd = cleaned.dateEnd;
  }
  next.timezone = cleaned.timezone;
  if (cleaned.description === '') {
    delete next.description;
  } else {
    next.description = cleaned.description;
  }
  const images = imagesAfter(event.images, cleaned, id);
  if (images) {
    next.images = images;
  } else {
    delete next.images;
  }
  return next;
}

function withRevision(party: ManagedParty, actorId: string, at: string, event: PublishedEvent, publication: PartyPublication, offersManaged: boolean): ManagedParty {
  return {
    ...party,
    publication,
    offersManaged,
    event,
    revisions: [...party.revisions, { actorId, at }],
  };
}

function publicationAfter(current: PartyPublication, publish: boolean): PartyPublication {
  if (publish) {
    return 'published';
  }
  switch (current) {
    case 'draft':
    case 'published':
      return current;
    default: {
      const unexpected: never = current;
      return unexpected;
    }
  }
}

/**
 * Create or update one party. A new party starts as a draft.
 * A later save appends the actor and keeps the earlier revisions.
 */
export function saveManagedParty(
  managed: readonly ManagedParty[],
  catalog: readonly PublishedEvent[],
  input: PartySaveInput,
  file: AccountFile,
  caller: PartyCaller,
  now: string,
  venues: readonly Venue[] = [],
): { managed: ManagedParty[]; saved: ManagedParty } {
  requireAdmin(file, caller);
  const cleaned = cleanInput(input);
  const existing = cleaned.id === undefined ? undefined : managed.find((party) => party.id === cleaned.id);
  const catalogEvent = cleaned.id === undefined ? undefined : catalog.find((event) => event.id === cleaned.id);
  if (cleaned.id !== undefined && !existing && !catalogEvent) {
    throw new Error('event was not saved');
  }
  if (!existing && !catalogEvent) {
    const id = newPartyId();
    const saved: ManagedParty = {
      id,
      origin: 'admin',
      publication: cleaned.publish ? 'published' : 'draft',
      revisions: [{ actorId: caller.actorId, at: now }],
      offersManaged: cleaned.offers.length > 0,
      event: applyInput({ id, title: cleaned.title, dateStart: cleaned.dateStart }, cleaned, id, venues),
    };
    return { managed: [...managed, saved], saved };
  }
  const base: ManagedParty = existing ?? {
    id: catalogEvent?.id ?? '',
    origin: 'catalog',
    publication: 'published',
    revisions: [],
    offersManaged: false,
    event: catalogEvent ?? { id: '', title: '', dateStart: '' },
  };
  const saved = withRevision(
    base,
    caller.actorId,
    now,
    applyInput(base.event, cleaned, base.id, venues),
    publicationAfter(base.publication, cleaned.publish),
    base.origin === 'catalog' ? true : cleaned.offers.length > 0 || base.offersManaged,
  );
  const next = existing ? managed.map((party) => (party.id === saved.id ? saved : party)) : [...managed, saved];
  return { managed: next, saved };
}

/** Drafts stay off the public list. A saved party replaces the imported row. A published admin party is included. */
export function publishedEventList(catalog: readonly PublishedEvent[], managed: readonly ManagedParty[]): PublishedEvent[] {
  const byId = new Map(managed.map((party) => [party.id, party]));
  const seen = new Set<string>();
  const events: PublishedEvent[] = [];
  for (const event of catalog) {
    seen.add(event.id);
    const party = byId.get(event.id);
    if (party?.publication === 'draft') {
      continue;
    }
    if (party) {
      events.push(party.event);
      continue;
    }
    events.push(event);
  }
  for (const party of managed) {
    if (party.origin === 'admin' && party.publication === 'published' && !seen.has(party.id)) {
      events.push(party.event);
    }
  }
  return events;
}

export function adminPartyList(catalog: readonly PublishedEvent[], managed: readonly ManagedParty[]): ManagedParty[] {
  const byId = new Map(managed.map((party) => [party.id, party]));
  const list: ManagedParty[] = [];
  for (const event of catalog) {
    const existing = byId.get(event.id);
    if (existing) {
      list.push(existing);
      byId.delete(event.id);
    } else {
      list.push({ id: event.id, origin: 'catalog', publication: 'published', revisions: [], offersManaged: false, event });
    }
  }
  for (const party of byId.values()) {
    list.push(party);
  }
  return list;
}

function parseRevision(value: unknown): PartyRevision | undefined {
  if (!isRecord(value) || typeof value.actorId !== 'string' || typeof value.at !== 'string') {
    return undefined;
  }
  const actorId = value.actorId.trim();
  const at = value.at.trim();
  if (actorId === '' || at === '') {
    return undefined;
  }
  return { actorId, at };
}

function parseRevisions(value: unknown): PartyRevision[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    const revision = parseRevision(item);
    return revision === undefined ? [] : [revision];
  });
}

function parseOrigin(value: unknown): PartyOrigin {
  return value === 'admin' ? 'admin' : 'catalog';
}

function parsePublication(value: unknown): PartyPublication {
  return value === 'draft' ? 'draft' : 'published';
}

function parseManaged(value: unknown): ManagedParty {
  if (!isRecord(value) || !isRecord(value.event) || typeof value.event.id !== 'string' || typeof value.event.title !== 'string' || typeof value.event.dateStart !== 'string') {
    throw new Error('event was not stored');
  }
  return {
    id: value.event.id,
    origin: parseOrigin(value.origin),
    publication: parsePublication(value.publication),
    revisions: parseRevisions(value.revisions),
    offersManaged: value.offersManaged === true,
    event: value.event as unknown as PublishedEvent,
  };
}

export function readManagedPartyFile(root = operationalDirectory()): ManagedParty[] {
  const path = join(root, fileName);
  if (!existsSync(path)) {
    return [];
  }
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
  if (!isRecord(parsed) || parsed.schemaVersion !== 1 || !Array.isArray(parsed.records)) {
    throw new Error('event was not stored');
  }
  return parsed.records.map((record) => parseManaged(record));
}

function writeManagedPartyFile(parties: readonly ManagedParty[], root: string): void {
  const path = join(root, fileName);
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify({ schemaVersion: 1, records: parties }, null, 2)}\n`, 'utf8');
  renameSync(temporary, path);
}

function managedFromRow(row: { origin: string; publication: string; revisions: unknown; offersManaged: boolean; document: unknown }): ManagedParty {
  if (!isRecord(row.document) || typeof row.document.id !== 'string') {
    throw new Error('event was not stored');
  }
  return {
    id: row.document.id,
    origin: parseOrigin(row.origin),
    publication: parsePublication(row.publication),
    revisions: parseRevisions(row.revisions),
    offersManaged: row.offersManaged,
    event: row.document as unknown as PublishedEvent,
  };
}

async function readDatabaseParties(): Promise<ManagedParty[]> {
  return (await readStoredPartyRows()).map((row) => managedFromRow(row));
}

export async function loadAdminParties(root?: string): Promise<ManagedParty[]> {
  if (usingDatabase(root)) {
    return readDatabaseParties();
  }
  const directory = root ?? operationalDirectory();
  return adminPartyList(readEvents().events, readManagedPartyFile(directory));
}

async function storeFlyer(id: string, input: PartySaveInput): Promise<void> {
  const action = input.imageAction ?? 'keep';
  if (action === 'keep') {
    return;
  }
  const { deleteCatalogImage, putCatalogImage } = await loadCatalogImages();
  switch (action) {
    case 'remove':
      await deleteCatalogImage('event', id);
      return;
    case 'replace':
      if (!input.imageBytes) {
        throw new Error('event was not saved');
      }
      await putCatalogImage('event', id, input.imageBytes);
      return;
    default: {
      const unexpected: never = action;
      throw new Error(unexpected);
    }
  }
}

export async function commitPartySave(input: PartySaveInput, file: AccountFile, caller: PartyCaller, now = new Date().toISOString(), root?: string): Promise<ManagedParty> {
  if (usingDatabase(root)) {
    return queueDatabase(async () => {
      const current = await readDatabaseParties();
      const venues = await loadVenueCatalog(root);
      const result = saveManagedParty(current, [], input, file, caller, now, venues);
      await upsertStoredParty({
        origin: result.saved.origin,
        publication: result.saved.publication,
        revisions: result.saved.revisions,
        offersManaged: result.saved.offersManaged,
        event: { ...result.saved.event } as Record<string, unknown>,
      });
      await storeFlyer(result.saved.id, input);
      return result.saved;
    });
  }
  const directory = root ?? operationalDirectory();
  const venues = await loadVenueCatalog(root);
  const result = saveManagedParty(readManagedPartyFile(directory), readEvents().events, input, file, caller, now, venues);
  writeManagedPartyFile(result.managed, directory);
  await storeFlyer(result.saved.id, input);
  return result.saved;
}

export function partyOffersForSale(event: PublishedEvent): ReturnType<typeof euroTicketOffers> {
  return euroTicketOffers(readTicketOffers(event.offers));
}
