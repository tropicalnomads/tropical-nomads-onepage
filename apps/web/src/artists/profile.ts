import { artistIdFromName, formatEventDate, type Locale } from 'tropical-nomads-shared';
import { displayedCountryFlag } from './flag.ts';

export interface ArtistProfile {
  id: string;
  name: string;
  country: string;
  isoCountry?: string;
  flag?: string;
  genres: string[];
  agencies?: string[];
  bio: string;
  bioPt?: string;
  soundcloud: string;
  instagram: string;
  website: string;
  photo?: string;
}

export interface ArtistEventCard {
  id: string;
  title: string;
  date: string;
  when: string;
  place: string;
  href: string;
  stageNames: string[];
  flyer?: string;
  venue?: string;
  city?: string;
  country?: string;
  dateEnd?: string;
  timezone?: string;
  durationHours?: number;
  mapUrl?: string;
  ticketUrl?: string;
  headliner?: true;
  upcoming: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function publishedArtistPhoto(photo: string, id: string): string | undefined {
  if (photo === `/artists/media/${id}`) {
    return photo;
  }
  const portrait = /^\/artist-portraits\/([a-z0-9-]{1,80})\.(png|jpe?g|webp)$/.exec(photo);
  return portrait?.[1] === id ? photo : undefined;
}

export function localizedArtistBio(artist: { bio: string; bioPt?: string }, language: Locale): string {
  switch (language) {
    case 'en':
      return artist.bio;
    case 'pt':
      return artist.bioPt && artist.bioPt.trim() !== '' ? artist.bioPt : artist.bio;
    default: {
      const unexpected: never = language;
      return unexpected;
    }
  }
}

function nameList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
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
    const photo = publishedArtistPhoto(text(item.photo), id);
    const isoCountry = text(item.isoCountry);
    const flag = displayedCountryFlag(isoCountry, text(item.countryFlag));
    const agencies = nameList(item.agencies);
    const bioPt = text(item.bioPt);
    profiles.push({
      id,
      name,
      country: text(item.country) || isoCountry,
      ...(isoCountry ? { isoCountry } : {}),
      ...(flag ? { flag } : {}),
      genres: nameList(item.genres),
      ...(agencies.length > 0 ? { agencies } : {}),
      bio: text(item.bio),
      ...(bioPt ? { bioPt } : {}),
      soundcloud: text(item.soundcloud),
      instagram: text(item.instagram),
      website: text(item.website),
      ...(photo ? { photo } : {}),
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
