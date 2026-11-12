'use server';

import { saveVenue } from 'tropical-nomads-api/venues';
import type { Venue } from 'tropical-nomads-shared';
import { apiOrigin } from '../api-origin.ts';
import { callPrivate, currentAccounts } from '../remote-store.ts';
import { adminActor } from './actions.ts';

export type VenueFormResult = { notice: 'saved'; venue: Venue } | { notice: 'denied' | 'invalid' };

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

export async function saveVenueAction(formData: FormData): Promise<VenueFormResult> {
  const actor = await adminActor();
  if (!actor) {
    return { notice: 'denied' };
  }
  const venue = {
    name: field(formData, 'name'),
    city: field(formData, 'city'),
    country: field(formData, 'country'),
    isoCountry: field(formData, 'isoCountry'),
    address: field(formData, 'address'),
    mapUrl: field(formData, 'mapUrl'),
  };
  try {
    if (!apiOrigin()) {
      const accounts = await currentAccounts();
      if (!accounts.profiles.some((profile) => profile.sub === actor.actorId && profile.role === 'admin')) {
        return { notice: 'denied' };
      }
      return { notice: 'saved', venue: await saveVenue(venue) };
    }
    const saved = await callPrivate<Venue>('save-venue', { caller: actor, venue });
    if (typeof saved.id !== 'string' || saved.id.trim() === '' || typeof saved.name !== 'string' || typeof saved.city !== 'string') {
      return { notice: 'invalid' };
    }
    return { notice: 'saved', venue: saved };
  } catch {
    return { notice: 'invalid' };
  }
}
