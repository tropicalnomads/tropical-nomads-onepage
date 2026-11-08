'use server';

import { readAccounts } from 'tropical-nomads-api/accounts';
import { commitAddGuest, commitGuestCheckIn, commitGuestList, commitScan, commitTicketCheckIn, type CheckInOutcome } from 'tropical-nomads-api/check-in';
import { publishedParties } from 'tropical-nomads-api/tickets';
import { accountCanScan } from 'tropical-nomads-shared';
import { currentAccountSub } from '../account/actions';

export interface CheckInActionResult {
  admitted: boolean;
  reason?: CheckInOutcome['reason'] | 'denied';
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
  const profile = readAccounts().profiles.find((item) => item.sub === sub);
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

function parties(): string[] {
  return publishedParties()
    .map((party) => party.id)
    .filter((id) => id.trim() !== '');
}

function fromOutcome(outcome: CheckInOutcome): CheckInActionResult {
  return { admitted: outcome.admitted, reason: outcome.reason };
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
    return fromOutcome(await commitScan(actor, partyId, payload, parties(), new Date().toISOString()));
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
    return fromOutcome(await commitTicketCheckIn(actor, field(formData, 'partyId'), field(formData, 'ticketId'), parties(), new Date().toISOString()));
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
    return fromOutcome(await commitGuestCheckIn(actor, field(formData, 'partyId'), field(formData, 'guestId'), parties(), new Date().toISOString()));
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
    await commitGuestList(actor, field(formData, 'partyId'), field(formData, 'listName'), parties(), new Date().toISOString());
    return { admitted: true };
  } catch {
    return { admitted: false, reason: 'denied' };
  }
}

export async function addGuestAction(formData: FormData): Promise<CheckInActionResult> {
  if (rejected(formData)) {
    return { admitted: false, reason: 'denied' };
  }
  const actor = await staff();
  if (!actor || actor.role !== 'admin') {
    return { admitted: false, reason: 'denied' };
  }
  try {
    await commitAddGuest(actor, field(formData, 'listId'), field(formData, 'guestName'), parties(), new Date().toISOString());
    return { admitted: true };
  } catch {
    return { admitted: false, reason: 'denied' };
  }
}
