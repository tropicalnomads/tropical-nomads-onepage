'use server';

import { commitPartySave, loadAdminParties } from 'tropical-nomads-api/parties';
import type { ManagedParty, PartyOfferInput } from 'tropical-nomads-api/parties';
import { currentAccountSub } from '../account/actions';
import { apiOrigin } from '../api-origin.ts';
import { callPrivate, currentAccounts } from '../remote-store.ts';

export interface PartyFormResult {
  notice: 'saved' | 'denied' | 'invalid';
  id?: string;
}

const blockedFields = new Set(['origin', 'publication', 'revisions', 'actorId', 'offersManaged', 'secret', 'status', 'validForEntry', 'role']);

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

function offerRows(formData: FormData): PartyOfferInput[] {
  const names = formData.getAll('offerName');
  const amounts = formData.getAll('offerAmount');
  const capacities = formData.getAll('offerCapacity');
  const count = Math.max(names.length, amounts.length, capacities.length);
  const offers: PartyOfferInput[] = [];
  for (let index = 0; index < count; index += 1) {
    const name = names[index];
    const amount = amounts[index];
    const capacity = capacities[index];
    offers.push({
      name: typeof name === 'string' ? name : '',
      amount: typeof amount === 'string' ? amount : '',
      capacity: typeof capacity === 'string' ? capacity : '',
    });
  }
  return offers;
}

export async function adminActor(): Promise<{ role: 'admin'; actorId: string } | undefined> {
  const sub = await currentAccountSub();
  if (!sub) {
    return undefined;
  }
  const profile = (await currentAccounts()).profiles.find((item) => item.sub === sub);
  if (!profile || profile.status !== 'active' || profile.role !== 'admin') {
    return undefined;
  }
  return { role: 'admin', actorId: sub };
}

export async function loadAdminEventList(): Promise<ManagedParty[]> {
  const actor = await adminActor();
  if (!actor) {
    return [];
  }
  if (apiOrigin()) {
    return callPrivate<ManagedParty[]>('admin-parties', { caller: actor });
  }
  return loadAdminParties();
}

export async function savePartyAction(formData: FormData): Promise<PartyFormResult> {
  for (const key of formData.keys()) {
    if (blockedFields.has(key)) {
      return { notice: 'invalid' };
    }
  }
  const actor = await adminActor();
  if (!actor) {
    return { notice: 'denied' };
  }
  const id = field(formData, 'id');
  try {
    const saved = apiOrigin()
      ? await callPrivate<ManagedParty>('save-party', {
          caller: actor,
          party: {
            ...(id === '' ? {} : { id }),
            title: field(formData, 'title'),
            dateStart: field(formData, 'dateStart'),
            dateEnd: field(formData, 'dateEnd'),
            timezone: field(formData, 'timezone'),
            venueName: field(formData, 'venueName'),
            venueCity: field(formData, 'venueCity'),
            description: field(formData, 'description'),
            imageUrl: field(formData, 'imageUrl'),
            artists: field(formData, 'artists'),
            offers: offerRows(formData),
            publish: field(formData, 'intent') === 'publish',
          },
        })
      : await commitPartySave(
          {
            ...(id === '' ? {} : { id }),
            title: field(formData, 'title'),
            dateStart: field(formData, 'dateStart'),
            dateEnd: field(formData, 'dateEnd'),
            timezone: field(formData, 'timezone'),
            venueName: field(formData, 'venueName'),
            venueCity: field(formData, 'venueCity'),
            description: field(formData, 'description'),
            imageUrl: field(formData, 'imageUrl'),
            artists: field(formData, 'artists'),
            offers: offerRows(formData),
            publish: field(formData, 'intent') === 'publish',
          },
          await currentAccounts(),
          actor,
        );
    return { notice: 'saved', id: saved.id };
  } catch {
    return { notice: 'invalid' };
  }
}
