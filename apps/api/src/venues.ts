import { parseVenueRecord, publicHttpsUrl, type Venue } from 'tropical-nomads-shared';
import { usingDatabase } from './database.ts';
import { readCatalog } from './published.ts';
import { queueDatabase, readStoredVenueDocuments, upsertStoredVenue } from './sql-store.ts';

export interface VenueSaveInput {
  name: string;
  city: string;
  country: string;
  isoCountry?: string;
  address?: string;
  mapUrl?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanLine(value: string, max: number, required: boolean): string {
  const text = value.trim();
  if (text === '') {
    if (required) {
      throw new Error('venue was not saved');
    }
    return '';
  }
  if (text.length > max || /[\u0000-\u001f]/.test(text)) {
    throw new Error('venue was not saved');
  }
  return text;
}

/** `The Sound House` in Dublin becomes `the-sound-house-dublin`. */
export function venueIdFromPlace(name: string, city: string): string {
  const base = `${name} ${city}`
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
    .replace(/-$/g, '');
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(base)) {
    throw new Error('venue was not saved');
  }
  return base;
}

export function readVenueSave(value: unknown): VenueSaveInput {
  if (!isRecord(value) || typeof value.name !== 'string' || typeof value.city !== 'string' || typeof value.country !== 'string') {
    throw new Error('venue was not saved');
  }
  const name = cleanLine(value.name, 120, true);
  const city = cleanLine(value.city, 80, true);
  const country = cleanLine(value.country, 80, true);
  const address = typeof value.address === 'string' ? cleanLine(value.address, 240, false) : '';
  const iso = typeof value.isoCountry === 'string' ? value.isoCountry.trim().toUpperCase() : '';
  if (iso !== '' && !/^[A-Z]{2}$/.test(iso)) {
    throw new Error('venue was not saved');
  }
  const mapRaw = typeof value.mapUrl === 'string' ? value.mapUrl.trim() : '';
  let mapUrl = '';
  if (mapRaw !== '') {
    const url = publicHttpsUrl(mapRaw);
    if (!url) {
      throw new Error('venue was not saved');
    }
    mapUrl = url;
  }
  return {
    name,
    city,
    country,
    ...(iso === '' ? {} : { isoCountry: iso }),
    ...(address === '' ? {} : { address }),
    ...(mapUrl === '' ? {} : { mapUrl }),
  };
}

function venueFromUnknown(value: unknown): Venue | undefined {
  const parsed = parseVenueRecord(value);
  if (!parsed.ok || !parsed.value.name || !parsed.value.city) {
    return undefined;
  }
  return parsed.value;
}

export function publishedVenues(): Venue[] {
  const file = readCatalog('venues');
  if (!isRecord(file) || !Array.isArray(file.venues)) {
    return [];
  }
  return file.venues.flatMap((item) => {
    const venue = venueFromUnknown(item);
    return venue ? [venue] : [];
  });
}

export async function loadVenueCatalog(root?: string): Promise<Venue[]> {
  if (!usingDatabase(root)) {
    return publishedVenues();
  }
  const rows = await readStoredVenueDocuments();
  return rows.flatMap((item) => {
    const venue = venueFromUnknown(item);
    return venue ? [venue] : [];
  });
}

export async function saveVenue(value: unknown): Promise<Venue> {
  const input = readVenueSave(value);
  if (!usingDatabase()) {
    throw new Error('venue was not saved');
  }
  const id = venueIdFromPlace(input.name, input.city);
  const document = { id, ...input };
  const parsed = parseVenueRecord(document);
  if (!parsed.ok) {
    throw new Error('venue was not saved');
  }
  await queueDatabase(async () => {
    await upsertStoredVenue({ ...parsed.value });
  });
  return parsed.value;
}
