import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { schemas } from './schemas.ts';

const dataDirectory = join(import.meta.dirname, '../../one-pager/public/data');

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

export interface PublishedEvent {
  id: string;
  title: string;
  dateStart: string;
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

function readPublishedFile(catalog: PublishedCatalog): unknown {
  const fileName = publishedFiles[catalog];
  const filePath = join(dataDirectory, fileName);
  const parsed: unknown = JSON.parse(readFileSync(filePath, 'utf8'));
  assertNoPrivateFields(parsed);
  return parsed;
}

export function readCatalog(catalog: PublishedCatalog): unknown {
  return readPublishedFile(catalog);
}

export function readEvents(): PublishedEvents {
  const parsed = readPublishedFile('events');
  if (!isEventsEnvelope(parsed)) {
    throw new Error('events catalog is not the published envelope');
  }
  return parsed;
}

function isEventsEnvelope(value: unknown): value is PublishedEvents {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  const source = record.source;
  return (
    typeof record.schemaVersion === 'number' &&
    typeof record.generatedAt === 'string' &&
    typeof source === 'object' &&
    source !== null &&
    typeof (source as { provider?: unknown }).provider === 'string' &&
    typeof (source as { endpoint?: unknown }).endpoint === 'string' &&
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
  return events.filter((event) => isUpcomingEvent(event, today));
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
