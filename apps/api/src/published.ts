import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sortByDateAsc } from 'tropical-nomads-shared';
import { schemas } from './schemas.ts';

function publishedDataDirectory(): string {
  try {
    const here = typeof import.meta.dirname === 'string' ? import.meta.dirname : dirname(fileURLToPath(import.meta.url));
    const besideApi = join(here, '../../one-pager/public/data');
    if (existsSync(besideApi)) {
      return besideApi;
    }
  } catch {
    // The web bundle does not keep this file's directory.
  }
  const fromWeb = resolve(process.cwd(), '../one-pager/public/data');
  if (existsSync(fromWeb)) {
    return fromWeb;
  }
  const fromRepo = resolve(process.cwd(), 'apps/one-pager/public/data');
  if (existsSync(fromRepo)) {
    return fromRepo;
  }
  throw new Error('published catalog is unavailable');
}

export const publishedFiles = {
  events: 'events.json',
  artists: 'artists.json',
  venues: 'venues.json',
  labels: 'labels.json',
  partners: 'partners.json',
  socials: 'socials.json',
  agencies: 'agencies.json',
} as const;

export type PublishedCatalog = keyof typeof publishedFiles;

const schemaForCatalog = {
  events: 'party',
  artists: 'artist',
  venues: 'venue',
  labels: 'label',
  partners: 'partner',
  socials: 'socialLink',
  agencies: 'agency',
} as const satisfies Record<PublishedCatalog, keyof typeof schemas>;

const privateKeys = new Set(['secret', 'password', 'cardNumber', 'cvc', 'cvv', 'pan', 'stopToken', '__proto__', 'constructor']);

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue | undefined };

export interface PublishedEventSource {
  provider?: string;
  id?: number;
  url?: string;
  status?: string;
  dateCreated?: string;
  dateModified?: string;
}

export interface PublishedEventLinks {
  goabase?: string;
  eventbrite?: string;
  tickets?: string;
  instagram?: string | string[];
  instagramPost?: string;
}

export interface PublishedEventImages {
  bannerLocal?: string;
  small?: string;
  medium?: string;
  large?: string;
  full?: string;
}

/**
 * Fields the stored event file is known to carry.
 * `source` and `images` stay here because `parseParty` does not copy them.
 * Extra stored keys stay on the object the route returns.
 */
export interface PublishedEvent {
  id: string;
  title: string;
  dateStart: string;
  dateEnd?: string;
  timezone?: string;
  durationHours?: number;
  type?: string;
  description?: string;
  organizer?: string;
  lineupRaw?: string;
  timetableFestivalId?: string;
  venue?: unknown;
  stages?: unknown;
  cardArtists?: string[];
  partnerIds?: string[];
  media?: unknown;
  offers?: unknown;
  images?: PublishedEventImages;
  links?: PublishedEventLinks;
  source?: PublishedEventSource;
}

export interface PublishedEvents {
  schemaVersion: number;
  generatedAt: string;
  source: { provider: string; endpoint: string };
  count: number;
  events: PublishedEvent[];
}

export function publishedSchema(catalog: PublishedCatalog): readonly string[] {
  return schemas[schemaForCatalog[catalog]];
}

function containsPrivateKey(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => containsPrivateKey(item));
  }
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return Object.entries(value).some(([key, inner]) => privateKeys.has(key) || containsPrivateKey(inner));
}

export function assertNoPrivateFields(value: unknown): void {
  if (containsPrivateKey(value)) {
    throw new Error('published catalog contains a private field');
  }
}

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return true;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }
  if (Array.isArray(value)) {
    return value.every((item) => isJsonValue(item));
  }
  if (typeof value === 'object') {
    return Object.values(value).every((item) => isJsonValue(item));
  }
  return false;
}

function readPublishedFile(catalog: PublishedCatalog): JsonValue {
  const fileName = publishedFiles[catalog];
  const filePath = join(/* turbopackIgnore: true */ publishedDataDirectory(), fileName);
  const parsed: unknown = JSON.parse(readFileSync(/* turbopackIgnore: true */ filePath, 'utf8'));
  assertNoPrivateFields(parsed);
  if (!isJsonValue(parsed)) {
    throw new Error('catalog is not json');
  }
  return parsed;
}

export function readCatalog(catalog: PublishedCatalog): JsonValue {
  return readPublishedFile(catalog);
}

/**
 * Returns the stored events file. Do not run these objects through `parseParty`:
 * that parser drops `source` and `images`, and it rejects extra Goabase fields.
 */
export function readEvents(): PublishedEvents {
  return publishedEventsFrom(readPublishedFile('events'));
}

export function publishedEventsFrom(value: unknown): PublishedEvents {
  if (!isEventsEnvelope(value)) {
    throw new Error('events catalog is not the published envelope');
  }
  return value;
}

function isEventsEnvelope(value: unknown): value is PublishedEvents {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  const source = record.source;
  if (typeof source !== 'object' || source === null || Array.isArray(source)) {
    return false;
  }
  const sourceRecord = source as Record<string, unknown>;
  return (
    typeof record.schemaVersion === 'number' &&
    typeof record.generatedAt === 'string' &&
    typeof sourceRecord.provider === 'string' &&
    typeof sourceRecord.endpoint === 'string' &&
    typeof record.count === 'number' &&
    Array.isArray(record.events)
  );
}

/**
 * Same rule as `isUpcomingEvent` in `apps/one-pager/src/lib/data.ts`.
 * `today` is the start of a calendar day in the process local timezone.
 * An event is upcoming when `dateStart` is at or after that instant.
 * An event that starts later the same day is upcoming. An event whose
 * start is before that midnight is past.
 */
export function isUpcomingEvent(event: Pick<PublishedEvent, 'dateStart'>, today: Date): boolean {
  const start = new Date(event.dateStart);
  return start.getTime() >= today.getTime();
}

export function upcomingEvents(events: readonly PublishedEvent[], today: Date): PublishedEvent[] {
  return sortByDateAsc(events.filter((event) => isUpcomingEvent(event, today)));
}

export function pastEvents(events: readonly PublishedEvent[], today: Date): PublishedEvent[] {
  return events.filter((event) => !isUpcomingEvent(event, today));
}

export function eventsView(events: PublishedEvents, selected: readonly PublishedEvent[]): PublishedEvents {
  return {
    schemaVersion: events.schemaVersion,
    generatedAt: events.generatedAt,
    source: events.source,
    count: selected.length,
    events: [...selected],
  };
}
