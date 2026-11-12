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
  const tickets = formData.getAll('offerTicket');
  const ends = formData.getAll('offerEnds');
  const count = Math.max(names.length, amounts.length, capacities.length, tickets.length, ends.length);
  const offers: PartyOfferInput[] = [];
  for (let index = 0; index < count; index += 1) {
    const name = names[index];
    const amount = amounts[index];
    const capacity = capacities[index];
    const ticket = tickets[index];
    const endsAt = ends[index];
    offers.push({
      name: typeof name === 'string' ? name : '',
      amount: typeof amount === 'string' ? amount : '',
      capacity: typeof capacity === 'string' ? capacity : '',
      ticket: typeof ticket === 'string' ? ticket : '',
      endsAt: typeof endsAt === 'string' ? endsAt : '',
    });
  }
  return offers;
}

async function imagePayload(formData: FormData): Promise<{ imageAction: 'keep' | 'replace' | 'remove'; imageBase64?: string }> {
  const image = formData.get('image');
  if (image instanceof File && image.size > 0) {
    if (image.size > 5_000_000) {
      throw new Error('event was not saved');
    }
    const bytes = new Uint8Array(await image.arrayBuffer());
    return { imageAction: 'replace', imageBase64: Buffer.from(bytes).toString('base64') };
  }
  return { imageAction: field(formData, 'imageAction') === 'remove' ? 'remove' : 'keep' };
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
    const image = await imagePayload(formData);
    const party = {
      ...(id === '' ? {} : { id }),
      title: field(formData, 'title'),
      dateStart: field(formData, 'dateStart'),
      dateEnd: field(formData, 'dateEnd'),
      timezone: field(formData, 'timezone'),
      venueId: field(formData, 'venueId'),
      description: field(formData, 'description'),
      imageUrl: field(formData, 'imageUrl'),
      imageAction: image.imageAction,
      ...(image.imageBase64 ? { imageBase64: image.imageBase64 } : {}),
      artists: field(formData, 'artists'),
      ...(typeof formData.get('headliners') === 'string' ? { headliners: field(formData, 'headliners') } : {}),
      offers: offerRows(formData),
      publish: field(formData, 'intent') === 'publish',
    };
    const saved = apiOrigin()
      ? await callPrivate<ManagedParty>('save-party', {
          caller: actor,
          party,
        })
      : await commitPartySave(
          {
            ...party,
            ...(image.imageBase64 ? { imageBytes: new Uint8Array(Buffer.from(image.imageBase64, 'base64')) } : {}),
          },
          await currentAccounts(),
          actor,
        );
    return { notice: 'saved', id: saved.id };
  } catch {
    return { notice: 'invalid' };
  }
}
