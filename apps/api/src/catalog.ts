import { eventsView, readCatalog, readEvents, type PublishedEvents } from './published.ts';
import { schemas } from './schemas.ts';

/**
 * Every stored party and artist is served.
 * This ticket does not remove a record for a draft, and it does not build calendar entries.
 * Ticket 18 owns that later work.
 */
export function serveStoredRecords<T>(records: readonly T[]): T[] {
  return [...records];
}

export interface CatalogArtist {
  name: string;
  isoCountry?: string;
  countryFlag?: string;
  genres?: string[];
  agencies?: string[];
}

export interface CatalogArtists {
  schemaVersion: number;
  generatedAt: string;
  count: number;
  artists: CatalogArtist[];
}

export function readPartyCatalog(): PublishedEvents {
  if (!schemas.party.includes('id') || !schemas.party.includes('dateStart')) {
    throw new Error('party schema is missing a required field');
  }
  const stored = readEvents();
  return eventsView(stored, serveStoredRecords(stored.events));
}

export function readArtistCatalog(): CatalogArtists {
  return artistsFrom(readCatalog('artists'));
}

export function artistsFrom(stored: unknown): CatalogArtists {
  if (!schemas.artist.includes('name')) {
    throw new Error('artist schema is missing name');
  }
  if (!isArtistFile(stored)) {
    throw new Error('artists catalog is not the published envelope');
  }
  const artists = serveStoredRecords(stored.artists);
  return {
    schemaVersion: stored.schemaVersion,
    generatedAt: stored.generatedAt,
    count: artists.length,
    artists,
  };
}

function isArtistFile(value: unknown): value is CatalogArtists {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.schemaVersion === 'number' &&
    typeof record.generatedAt === 'string' &&
    typeof record.count === 'number' &&
    Array.isArray(record.artists) &&
    record.artists.every((artist) => isCatalogArtist(artist))
  );
}

function isCatalogArtist(value: unknown): value is CatalogArtist {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const name = (value as { name?: unknown }).name;
  return typeof name === 'string' && name.trim() !== '';
}
