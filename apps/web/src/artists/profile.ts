import { artistIdFromName, formatEventDate, type Locale } from 'tropical-nomads-shared';

export interface ArtistProfile {
  id: string;
  name: string;
  country: string;
  flag?: string;
  genres: string[];
  bio: string;
  soundcloud: string;
  instagram: string;
  website: string;
  photo?: string;
}

export interface ArtistEventCard {
  id: string;
  title: string;
  when: string;
  place: string;
  flyer?: string;
  upcoming: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function artistProfilesFrom(body: unknown): ArtistProfile[] {
  if (!isRecord(body) || !Array.isArray(body.artists)) {
    return [];
  }
  const profiles: ArtistProfile[] = [];
  for (const item of body.artists) {
    if (!isRecord(item) || text(item.name) === '') {
      continue;
    }
    const name = text(item.name);
    const id = text(item.id) || artistIdFromName(name);
    const photo = text(item.photo);
    const flag = text(item.countryFlag);
    profiles.push({
      id,
      name,
      country: text(item.country) || text(item.isoCountry),
      ...(flag ? { flag } : {}),
      genres: Array.isArray(item.genres) ? item.genres.filter((genre): genre is string => typeof genre === 'string' && genre.trim() !== '') : [],
      bio: text(item.bio),
      soundcloud: text(item.soundcloud),
      instagram: text(item.instagram),
      website: text(item.website),
      ...(photo.startsWith('/artists/media/') ? { photo } : {}),
    });
  }
  return profiles;
}

export function lineupArtists(names: readonly string[], artists: readonly Pick<ArtistProfile, 'id' | 'name'>[]): { name: string; artistId?: string }[] {
  return names.map((name) => {
    const artist = artists.find((item) => item.name.trim().toLowerCase() === name.trim().toLowerCase());
    return artist ? { name, artistId: artist.id } : { name };
  });
}

export function artistWhen(iso: string, language: Locale): string {
  try {
    return formatEventDate({ dateStart: iso }, language);
  } catch {
    return iso;
  }
}
