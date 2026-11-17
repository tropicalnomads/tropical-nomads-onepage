'use server';

import { commitAddGuest, commitEnsureGuestLists, commitGuestCheckIn, commitGuestList, commitRemoveGuest, commitScan, commitTicketCheckIn, commitUpdateGuest, type CheckInCaller, type CheckInOutcome } from 'tropical-nomads-api/check-in';
import { loadPublishedParties } from 'tropical-nomads-api/tickets';
import { accountCanScan, type GuestList } from 'tropical-nomads-shared';
import { currentAccountSub } from '../account/actions';
import { apiOrigin } from '../api-origin.ts';
import { callPrivate, currentAccounts } from '../remote-store.ts';

export async function ensuredGuestLists(partyId: string, actor: CheckInCaller): Promise<GuestList[]> {
  if (apiOrigin()) {
    return callPrivate<GuestList[]>('ensure-guest-lists', { caller: actor, partyId });
  }
  return commitEnsureGuestLists(partyId, new Date().toISOString());
}

export interface CheckInActionResult {
  admitted: boolean;
  reason?: CheckInOutcome['reason'] | 'denied';
  buyerName?: string;
}

const blockedFields = new Set(['role', 'userId', 'result', 'reason', 'status', 'secret', 'actorId']);

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

function rejected(formData: FormData): boolean {
  for (const key of formData.keys()) {
    if (blockedFields.has(key)) {
      return true;
    }
  }
  return false;
}

async function staff(): Promise<{ role: 'admin' | 'door'; actorId: string } | undefined> {
  const sub = await currentAccountSub();
  if (!sub) {
    return undefined;
  }
  const profile = (await currentAccounts()).profiles.find((item) => item.sub === sub);
  if (!profile || profile.status !== 'active') {
    return undefined;
  }
  if (profile.role === 'admin') {
    return { role: 'admin', actorId: profile.sub };
  }
  if (profile.role === 'door' && accountCanScan(profile)) {
    return { role: 'door', actorId: profile.sub };
  }
  return undefined;
}

async function parties(): Promise<string[]> {
  return (await loadPublishedParties())
    .map((party) => party.id)
    .filter((id) => id.trim() !== '');
}

function fromOutcome(outcome: CheckInOutcome): CheckInActionResult {
  return {
    admitted: outcome.admitted,
    ...(outcome.reason ? { reason: outcome.reason } : {}),
    ...(outcome.buyerName ? { buyerName: outcome.buyerName } : {}),
  };
}

export async function scanAction(partyId: string, payloadText: string): Promise<CheckInActionResult> {
  const actor = await staff();
  if (!actor || payloadText.trim() === '' || payloadText.length > 500) {
    return { admitted: false, reason: 'denied' };
  }
  let payload: unknown;
  try {
    payload = JSON.parse(payloadText);
  } catch {
    return { admitted: false, reason: 'unknown' };
  }
  try {
    if (apiOrigin()) {
      return fromOutcome(await callPrivate<CheckInOutcome>('scan', { caller: actor, partyId, payload }));
    }
    return fromOutcome(await commitScan(actor, partyId, payload, await parties(), new Date().toISOString()));
  } catch {
    return { admitted: false, reason: 'denied' };
  }
}

export async function checkInTicketAction(formData: FormData): Promise<CheckInActionResult> {
  if (rejected(formData)) {
    return { admitted: false, reason: 'denied' };
  }
  const actor = await staff();
  if (!actor) {
    return { admitted: false, reason: 'denied' };
  }
  try {
    if (apiOrigin()) {
      return fromOutcome(
        await callPrivate<CheckInOutcome>('check-in-ticket', { caller: actor, partyId: field(formData, 'partyId'), ticketId: field(formData, 'ticketId') }),
      );
    }
    return fromOutcome(await commitTicketCheckIn(actor, field(formData, 'partyId'), field(formData, 'ticketId'), await parties(), new Date().toISOString()));
  } catch {
    return { admitted: false, reason: 'denied' };
  }
}

export async function checkInGuestAction(formData: FormData): Promise<CheckInActionResult> {
  if (rejected(formData)) {
    return { admitted: false, reason: 'denied' };
  }
  const actor = await staff();
  if (!actor) {
    return { admitted: false, reason: 'denied' };
  }
  try {
    if (apiOrigin()) {
      return fromOutcome(
        await callPrivate<CheckInOutcome>('check-in-guest', { caller: actor, partyId: field(formData, 'partyId'), guestId: field(formData, 'guestId') }),
      );
    }
    return fromOutcome(await commitGuestCheckIn(actor, field(formData, 'partyId'), field(formData, 'guestId'), await parties(), new Date().toISOString()));
  } catch {
    return { admitted: false, reason: 'denied' };
  }
}

export async function createGuestListAction(formData: FormData): Promise<CheckInActionResult> {
  if (rejected(formData)) {
    return { admitted: false, reason: 'denied' };
  }
  const actor = await staff();
  if (!actor || actor.role !== 'admin') {
    return { admitted: false, reason: 'denied' };
  }
  try {
    if (apiOrigin()) {
      await callPrivate('create-guest-list', { caller: actor, partyId: field(formData, 'partyId'), name: field(formData, 'listName') });
    } else {
      await commitGuestList(actor, field(formData, 'partyId'), field(formData, 'listName'), await parties(), new Date().toISOString());
    }
    return { admitted: true };
  } catch {
    return { admitted: false, reason: 'denied' };
  }
}

export interface GuestParticipantField {
  id: string;
  name: string;
  email: string;
  observation: string;
}

export interface GuestPersonWriteResult {
  ok: boolean;
  participants?: GuestParticipantField[];
}

function participantsFrom(value: unknown): GuestParticipantField[] | undefined {
  if (typeof value !== 'object' || value === null || !('participants' in value) || !Array.isArray(value.participants)) {
    return undefined;
  }
  const participants: GuestParticipantField[] = [];
  for (const item of value.participants) {
    if (typeof item !== 'object' || item === null) {
      return undefined;
    }
    const row = item as Record<string, unknown>;
    if (typeof row.id !== 'string' || typeof row.name !== 'string') {
      return undefined;
    }
    participants.push({
      id: row.id,
      name: row.name,
      email: typeof row.email === 'string' ? row.email : '',
      observation: typeof row.observation === 'string' ? row.observation : '',
    });
  }
  return participants;
}

export async function saveGuestPersonAction(input: {
  listId: string;
  guestId?: string;
  name: string;
  email: string;
  observation: string;
}): Promise<GuestPersonWriteResult> {
  const actor = await staff();
  if (!actor || actor.role !== 'admin') {
    return { ok: false };
  }
  const details = { name: input.name, email: input.email, observation: input.observation };
  try {
    if (apiOrigin()) {
      const saved = await callPrivate<unknown>(input.guestId ? 'update-guest' : 'add-guest', {
        caller: actor,
        listId: input.listId,
        ...(input.guestId ? { guestId: input.guestId } : {}),
        ...details,
      });
      const participants = participantsFrom(saved);
      return participants ? { ok: true, participants } : { ok: false };
    }
    const list = input.guestId
      ? await commitUpdateGuest(actor, input.listId, input.guestId, details)
      : await commitAddGuest(actor, input.listId, input.name, new Date().toISOString(), details);
    return {
      ok: true,
      participants: list.guests.map((guest) => ({
        id: guest.id,
        name: guest.name,
        email: guest.email ?? '',
        observation: guest.observation ?? '',
      })),
    };
  } catch {
    return { ok: false };
  }
}

export async function removeGuestPersonAction(input: { listId: string; guestId: string }): Promise<GuestPersonWriteResult> {
  const actor = await staff();
  if (!actor || actor.role !== 'admin') {
    return { ok: false };
  }
  try {
    if (apiOrigin()) {
      const saved = await callPrivate<unknown>('remove-guest', { caller: actor, listId: input.listId, guestId: input.guestId });
      const participants = participantsFrom(saved);
      return participants ? { ok: true, participants } : { ok: false };
    }
    const list = await commitRemoveGuest(actor, input.listId, input.guestId);
    return {
      ok: true,
      participants: list.guests.map((guest) => ({
        id: guest.id,
        name: guest.name,
        email: guest.email ?? '',
        observation: guest.observation ?? '',
      })),
    };
  } catch {
    return { ok: false };
  }
}
