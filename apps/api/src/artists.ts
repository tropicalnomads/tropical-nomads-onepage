import { artistIdFromName, httpsProfileUrl, soundCloudPlayerUrl } from 'tropical-nomads-shared';
import { usingDatabase } from './database.ts';
import { loadCatalogImages } from './s3-load.ts';
import { queueDatabase, readStoredArtist, upsertStoredArtist } from './sql-store.ts';

export interface ArtistSaveInput {
  id: string;
  name: string;
  country: string;
  isoCountry?: string;
  genres: string[];
  bio: string;
  soundcloud: string;
  instagram: string;
  website: string;
  imageAction: 'keep' | 'replace' | 'remove';
  imageBytes?: Uint8Array;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanLine(value: string, max: number): string {
  const text = value.trim();
  if (text.length > max || /[\u0000-\u001f]/.test(text)) {
    throw new Error('artist was not saved');
  }
  return text;
}

function readIsoCountry(value: Record<string, unknown>): string | undefined {
  if (!Object.prototype.hasOwnProperty.call(value, 'isoCountry')) {
    return undefined;
  }
  if (typeof value.isoCountry !== 'string') {
    throw new Error('artist was not saved');
  }
  const iso = value.isoCountry.trim().toUpperCase();
  if (iso !== '' && !/^[A-Z]{2}$/.test(iso)) {
    throw new Error('artist was not saved');
  }
  return iso;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const genres: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') {
      throw new Error('artist was not saved');
    }
    const text = cleanLine(item, 40);
    if (text !== '') {
      genres.push(text);
    }
  }
  if (genres.length > 12) {
    throw new Error('artist was not saved');
  }
  return genres;
}

export function readArtistSave(value: unknown): ArtistSaveInput {
  if (!isRecord(value) || typeof value.name !== 'string') {
    throw new Error('artist was not saved');
  }
  const name = cleanLine(value.name, 80);
  if (name === '') {
    throw new Error('artist was not saved');
  }
  const requestedId = typeof value.id === 'string' && value.id.trim() !== '' ? value.id.trim() : artistIdFromName(name);
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(requestedId)) {
    throw new Error('artist was not saved');
  }
  const country = typeof value.country === 'string' ? cleanLine(value.country, 80) : '';
  const isoCountry = readIsoCountry(value);
  const bio = typeof value.bio === 'string' ? value.bio : '';
  if (bio.length > 4000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(bio)) {
    throw new Error('artist was not saved');
  }
  const soundcloud = typeof value.soundcloud === 'string' ? value.soundcloud.trim() : '';
  const instagram = typeof value.instagram === 'string' ? value.instagram.trim() : '';
  const website = typeof value.website === 'string' ? value.website.trim() : '';
  if (soundcloud !== '' && !soundCloudPlayerUrl(soundcloud)) {
    throw new Error('artist was not saved');
  }
  if (instagram !== '' && !httpsProfileUrl(instagram, 'instagram.com')) {
    throw new Error('artist was not saved');
  }
  if (website !== '' && !httpsProfileUrl(website)) {
    throw new Error('artist was not saved');
  }
  const imageAction = value.imageAction === 'replace' || value.imageAction === 'remove' || value.imageAction === 'keep' ? value.imageAction : 'keep';
  const imageBase64 = typeof value.imageBase64 === 'string' ? value.imageBase64 : '';
  return {
    id: requestedId,
    name,
    country,
    ...(isoCountry === undefined ? {} : { isoCountry }),
    genres: stringList(value.genres),
    bio: bio.trim(),
    soundcloud,
    instagram: instagram === '' ? '' : (httpsProfileUrl(instagram, 'instagram.com') ?? ''),
    website: website === '' ? '' : (httpsProfileUrl(website) ?? ''),
    imageAction: imageBase64 !== '' ? 'replace' : imageAction,
  };
}

export function withProfile(existing: Record<string, unknown>, input: ArtistSaveInput): Record<string, unknown> {
  const next: Record<string, unknown> = { ...existing, id: input.id, name: input.name };
  if (input.country === '') {
    delete next.country;
  } else {
    next.country = input.country;
  }
  if (input.isoCountry === '') {
    delete next.isoCountry;
    delete next.countryFlag;
  } else if (input.isoCountry) {
    next.isoCountry = input.isoCountry;
    next.countryFlag = input.isoCountry;
  }
  next.genres = input.genres;
  if (input.bio === '') {
    delete next.bio;
  } else {
    next.bio = input.bio;
  }
  if (input.soundcloud === '') {
    delete next.soundcloud;
  } else {
    next.soundcloud = input.soundcloud;
  }
  if (input.instagram === '') {
    delete next.instagram;
  } else {
    next.instagram = input.instagram;
  }
  if (input.website === '') {
    delete next.website;
  } else {
    next.website = input.website;
  }
  const photo = typeof next.photo === 'string' ? next.photo : '';
  switch (input.imageAction) {
    case 'keep':
      break;
    case 'replace':
      next.photo = `/artists/media/${input.id}`;
      break;
    case 'remove':
      if (photo.startsWith('/artists/media/')) {
        delete next.photo;
      }
      break;
    default: {
      const unexpected: never = input.imageAction;
      throw new Error(unexpected);
    }
  }
  return next;
}

async function storePhoto(input: ArtistSaveInput, bytes?: Uint8Array): Promise<void> {
  if (input.imageAction === 'keep') {
    return;
  }
  const { deleteCatalogImage, putCatalogImage } = await loadCatalogImages();
  switch (input.imageAction) {
    case 'remove':
      if (input.id) {
        await deleteCatalogImage('artist', input.id);
      }
      return;
    case 'replace':
      if (!input.id || !bytes) {
        throw new Error('artist was not saved');
      }
      await putCatalogImage('artist', input.id, bytes);
      return;
    default: {
      const unexpected: never = input.imageAction;
      throw new Error(unexpected);
    }
  }
}

export async function saveArtistProfile(value: unknown): Promise<{ id: string }> {
  const input = readArtistSave(value);
  if (!usingDatabase() || !input.id) {
    throw new Error('artist was not saved');
  }
  const imageBase64 = isRecord(value) && typeof value.imageBase64 === 'string' ? value.imageBase64 : '';
  const bytes = imageBase64 === '' ? undefined : (await loadCatalogImages()).decodeCatalogImage(imageBase64);
  await queueDatabase(async () => {
    const existing = await readStoredArtist(input.id ?? '');
    const document = withProfile(existing ?? {}, input);
    await upsertStoredArtist(document);
    await storePhoto(input, bytes);
  });
  return { id: input.id };
}
