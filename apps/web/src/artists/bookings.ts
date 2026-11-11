import { artistIdFromName } from 'tropical-nomads-shared';
import rosterFile from './bookings-roster.json' with { type: 'json' };
import { publishedArtistPhoto, type ArtistProfile } from './profile.ts';

interface BookingsArtist {
  slug: string;
  name: string;
  isoCountry?: string;
  genres: string[];
  bio: { en: string; pt: string };
  photo?: string;
  website?: string;
  instagram?: string;
  soundcloud?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function flagFromIso(isoCountry: string): string | undefined {
  if (isoCountry.length !== 2) {
    return undefined;
  }
  const code = isoCountry.toUpperCase();
  const base = 0x1f1e6;
  const first = code.charCodeAt(0) - 65;
  const second = code.charCodeAt(1) - 65;
  if (first < 0 || first > 25 || second < 0 || second > 25) {
    return undefined;
  }
  return String.fromCodePoint(base + first, base + second);
}

function bookingsArtist(value: unknown): BookingsArtist | undefined {
  if (!isRecord(value) || !isRecord(value.bio)) {
    return undefined;
  }
  const name = text(value.name);
  const slug = text(value.slug);
  const english = text(value.bio.en);
  const portuguese = text(value.bio.pt);
  if (name === '' || slug === '' || english === '' || portuguese === '' || !Array.isArray(value.genres)) {
    return undefined;
  }
  const genres = value.genres.filter((genre): genre is string => typeof genre === 'string' && genre.trim() !== '').map((genre) => genre.trim());
  const isoCountry = text(value.isoCountry);
  const photo = text(value.photo);
  const website = text(value.website);
  const instagram = text(value.instagram);
  const soundcloud = text(value.soundcloud);
  return {
    slug,
    name,
    ...(isoCountry ? { isoCountry } : {}),
    genres,
    bio: { en: english, pt: portuguese },
    ...(photo ? { photo } : {}),
    ...(website ? { website } : {}),
    ...(instagram ? { instagram } : {}),
    ...(soundcloud ? { soundcloud } : {}),
  };
}

function bookingsRoster(): BookingsArtist[] {
  if (!isRecord(rosterFile) || !Array.isArray(rosterFile.artists)) {
    return [];
  }
  return rosterFile.artists.flatMap((artist) => {
    const parsed = bookingsArtist(artist);
    return parsed ? [parsed] : [];
  });
}

function sameBooking(profile: ArtistProfile, artist: BookingsArtist): boolean {
  const rosterId = artistIdFromName(artist.name);
  return artist.slug === profile.id || rosterId === profile.id || rosterId === artistIdFromName(profile.name);
}

function mergeBooking(profile: ArtistProfile, artist: BookingsArtist): ArtistProfile {
  const photo = artist.photo ? publishedArtistPhoto(artist.photo, profile.id) : undefined;
  const flag = profile.flag ?? (artist.isoCountry ? flagFromIso(artist.isoCountry) : undefined);
  return {
    ...profile,
    country: profile.country || artist.isoCountry || '',
    ...(profile.isoCountry || !artist.isoCountry ? {} : { isoCountry: artist.isoCountry }),
    ...(flag ? { flag } : {}),
    genres: artist.genres,
    bio: artist.bio.en,
    bioPt: artist.bio.pt,
    soundcloud: profile.soundcloud || artist.soundcloud || '',
    instagram: profile.instagram || artist.instagram || '',
    website: profile.website || artist.website || '',
    ...(photo ? { photo } : {}),
  };
}

function profileFromBooking(artist: BookingsArtist): ArtistProfile {
  const id = artistIdFromName(artist.name);
  const photo = artist.photo ? publishedArtistPhoto(artist.photo, id) : undefined;
  const flag = artist.isoCountry ? flagFromIso(artist.isoCountry) : undefined;
  return {
    id,
    name: artist.name,
    country: artist.isoCountry ?? '',
    ...(artist.isoCountry ? { isoCountry: artist.isoCountry } : {}),
    ...(flag ? { flag } : {}),
    genres: artist.genres,
    bio: artist.bio.en,
    bioPt: artist.bio.pt,
    soundcloud: artist.soundcloud ?? '',
    instagram: artist.instagram ?? '',
    website: artist.website ?? '',
    ...(photo ? { photo } : {}),
  };
}

export function withBookingsArtists(profiles: readonly ArtistProfile[]): ArtistProfile[] {
  const roster = bookingsRoster();
  const matched = new Set<string>();
  const next = profiles.map((profile) => {
    const artist = roster.find((item) => sameBooking(profile, item));
    if (!artist) {
      return profile;
    }
    matched.add(artist.slug);
    return mergeBooking(profile, artist);
  });
  for (const artist of roster) {
    if (!matched.has(artist.slug)) {
      next.push(profileFromBooking(artist));
    }
  }
  return next;
}
