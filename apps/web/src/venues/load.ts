import { api } from 'tropical-nomads-api';
import { apiOrigin } from '../api-origin.ts';

export interface VenueChoice {
  id: string;
  name: string;
  city: string;
  country: string;
  address?: string;
  mapUrl?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function venueChoicesFrom(value: unknown): VenueChoice[] {
  if (!isRecord(value) || !Array.isArray(value.venues)) {
    return [];
  }
  return value.venues.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }
    const id = text(item.id);
    const name = text(item.name);
    const city = text(item.city);
    const country = text(item.country);
    if (id === '' || name === '' || city === '') {
      return [];
    }
    const address = text(item.address);
    const mapUrl = text(item.mapUrl);
    return [
      {
        id,
        name,
        city,
        country,
        ...(address === '' ? {} : { address }),
        ...(mapUrl === '' ? {} : { mapUrl }),
      },
    ];
  });
}

async function readJson(path: string): Promise<unknown> {
  const origin = apiOrigin();
  if (origin) {
    const response = await fetch(`${origin}${path}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('catalog is unavailable');
    }
    return response.json();
  }
  const response = await api.request(path);
  if (response.status !== 200) {
    throw new Error('catalog is unavailable');
  }
  return response.json();
}

export async function loadVenues(): Promise<VenueChoice[]> {
  try {
    return venueChoicesFrom(await readJson('/venues'));
  } catch {
    return [];
  }
}
