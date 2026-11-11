import { api } from 'tropical-nomads-api';
import { apiOrigin } from '../api-origin.ts';
import { withBookingsArtists } from './bookings.ts';
import { artistEventHistory } from './events.ts';
import { artistProfilesFrom, type ArtistEventCard, type ArtistProfile } from './profile.ts';

export type { ArtistEventCard, ArtistProfile } from './profile.ts';
export { artistProfilesFrom, artistWhen, lineupArtists } from './profile.ts';
export { artistEventHistory } from './events.ts';
export { artistRequestMailto, type ArtistRequestType } from './request.ts';

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
    return withBookingsArtists(artistProfilesFrom(await readJson('/artists')));
  } catch {
    return [];
  }
}

export async function loadArtistPage(id: string): Promise<{ artist: ArtistProfile; upcoming: ArtistEventCard[]; past: ArtistEventCard[] } | undefined> {
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(id)) {
    return undefined;
  }
  try {
    const [artistsBody, eventsBody] = await Promise.all([readJson('/artists'), readJson('/events')]);
    const artist = withBookingsArtists(artistProfilesFrom(artistsBody)).find((item) => item.id === id);
    if (!artist) {
      return undefined;
    }
    const history = artistEventHistory(eventsBody, artist.name, new Date());
    return { artist, upcoming: history.upcoming, past: history.past };
  } catch {
    return undefined;
  }
}
