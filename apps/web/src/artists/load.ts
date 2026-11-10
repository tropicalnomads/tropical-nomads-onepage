import { api } from 'tropical-nomads-api';
import { uploadedEventFlyer } from '../admin/event-image.ts';
import { apiOrigin } from '../api-origin.ts';
import { bannerSrc } from '../events/assets.ts';
import { artistProfilesFrom, type ArtistEventCard, type ArtistProfile } from './profile.ts';

export type { ArtistEventCard, ArtistProfile } from './profile.ts';
export { artistProfilesFrom, artistWhen, lineupArtists } from './profile.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
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

export async function loadArtistProfiles(): Promise<ArtistProfile[]> {
  try {
    return artistProfilesFrom(await readJson('/artists'));
  } catch {
    return [];
  }
}

function eventCards(body: unknown, artistName: string, now: Date): ArtistEventCard[] {
  if (!isRecord(body) || !Array.isArray(body.events)) {
    return [];
  }
  const cards: ArtistEventCard[] = [];
  for (const item of body.events) {
    if (!isRecord(item) || text(item.title) === '' || text(item.id) === '') {
      continue;
    }
    const names = Array.isArray(item.cardArtists) ? item.cardArtists.filter((name): name is string => typeof name === 'string') : [];
    if (!names.some((name) => name.trim().toLowerCase() === artistName.trim().toLowerCase())) {
      continue;
    }
    const start = new Date(text(item.dateStart));
    if (Number.isNaN(start.getTime())) {
      continue;
    }
    const venue = isRecord(item.venue) ? item.venue : {};
    const images = isRecord(item.images) ? item.images : {};
    const full = text(images.full);
    const flyer = uploadedEventFlyer(full) ?? bannerSrc(text(images.bannerLocal));
    const place = [text(venue.name), text(venue.city)].filter((part) => part !== '').join(', ');
    cards.push({
      id: text(item.id),
      title: text(item.title),
      when: text(item.dateStart),
      place,
      ...(flyer ? { flyer } : {}),
      upcoming: start.getTime() >= now.getTime(),
    });
  }
  return cards;
}

export async function loadArtistPage(id: string): Promise<{ artist: ArtistProfile; upcoming: ArtistEventCard[]; past: ArtistEventCard[] } | undefined> {
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(id)) {
    return undefined;
  }
  try {
    const [artistsBody, eventsBody] = await Promise.all([readJson('/artists'), readJson('/events')]);
    const artist = artistProfilesFrom(artistsBody).find((item) => item.id === id);
    if (!artist) {
      return undefined;
    }
    const cards = eventCards(eventsBody, artist.name, new Date());
    return {
      artist,
      upcoming: cards.filter((card) => card.upcoming).sort((left, right) => left.when.localeCompare(right.when)),
      past: cards.filter((card) => !card.upcoming).sort((left, right) => right.when.localeCompare(left.when)),
    };
  } catch {
    return undefined;
  }
}
