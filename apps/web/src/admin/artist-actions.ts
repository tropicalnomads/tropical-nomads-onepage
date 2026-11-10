'use server';

import { saveArtistProfile } from 'tropical-nomads-api/artists';
import { apiOrigin } from '../api-origin.ts';
import { callPrivate, currentAccounts } from '../remote-store.ts';
import { adminActor } from './actions.ts';

export type ArtistFormResult = { notice: 'saved'; id: string } | { notice: 'denied' | 'invalid' };

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

function genres(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '');
}

async function imagePayload(formData: FormData): Promise<{ imageAction: 'keep' | 'replace' | 'remove'; imageBase64?: string }> {
  const image = formData.get('image');
  if (image instanceof File && image.size > 0) {
    if (image.size > 5_000_000) {
      throw new Error('artist was not saved');
    }
    const bytes = new Uint8Array(await image.arrayBuffer());
    return { imageAction: 'replace', imageBase64: Buffer.from(bytes).toString('base64') };
  }
  return { imageAction: field(formData, 'imageAction') === 'remove' ? 'remove' : 'keep' };
}

export async function saveArtistAction(formData: FormData): Promise<ArtistFormResult> {
  const actor = await adminActor();
  if (!actor) {
    return { notice: 'denied' };
  }
  try {
    const image = await imagePayload(formData);
    const artist = {
      ...(field(formData, 'id') === '' ? {} : { id: field(formData, 'id') }),
      name: field(formData, 'name'),
      country: field(formData, 'country'),
      genres: genres(field(formData, 'genres')),
      bio: field(formData, 'bio'),
      soundcloud: field(formData, 'soundcloud'),
      instagram: field(formData, 'instagram'),
      website: field(formData, 'website'),
      imageAction: image.imageAction,
      ...(image.imageBase64 ? { imageBase64: image.imageBase64 } : {}),
    };
    if (!apiOrigin()) {
      const accounts = await currentAccounts();
      if (!accounts.profiles.some((profile) => profile.sub === actor.actorId && profile.role === 'admin')) {
        return { notice: 'denied' };
      }
      const saved = await saveArtistProfile(artist);
      return { notice: 'saved', id: saved.id };
    }
    const saved = await callPrivate<{ id?: unknown }>('save-artist', { caller: actor, artist });
    if (typeof saved.id !== 'string' || saved.id.trim() === '') {
      return { notice: 'invalid' };
    }
    return { notice: 'saved', id: saved.id };
  } catch {
    return { notice: 'invalid' };
  }
}
