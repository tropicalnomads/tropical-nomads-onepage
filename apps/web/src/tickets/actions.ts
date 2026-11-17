'use server';

import { accountCanPurchase, containsCardNumber, ticketOwnerLimit, type IssuedTicket, type Locale } from 'tropical-nomads-shared';
import { commitTicket, loadPartyTitles } from 'tropical-nomads-api/tickets';
import { notifyTicketHolders } from 'tropical-nomads-api/ticket-mail';
import { currentAccountSub } from '../account/actions';
import { apiOrigin } from '../api-origin.ts';
import type { PaymentNotice } from '../i18n/copy';
import { callPrivate, currentAccounts } from '../remote-store.ts';

export interface TicketActionResult {
  notice: PaymentNotice;
  ticketId?: string;
  unsent?: string[];
}

const blockedFields = new Set([
  'userId',
  'amount',
  'currency',
  'status',
  'secret',
  'validForEntry',
  'cardNumber',
  'cvc',
  'cvv',
  'pan',
  'password',
]);

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

function rejected(formData: FormData): boolean {
  const values: string[] = [];
  for (const [key, value] of formData.entries()) {
    if (blockedFields.has(key)) {
      return true;
    }
    if (typeof value === 'string') {
      values.push(value);
    }
  }
  return containsCardNumber(values);
}

function noticeFrom(error: unknown): PaymentNotice {
  const message = error instanceof Error ? error.message : '';
  switch (message) {
    case 'billing address is required':
      return 'billing-required';
    case 'card number is not allowed':
    case 'account file contains a card number':
      return 'card-rejected';
    case 'offer is sold out':
      return 'sold-out';
    case 'owner is required':
      return 'owner-required';
    default:
      return 'cannot-pay';
  }
}

function ownersFrom(formData: FormData): { fullName: string; email: string }[] | undefined {
  const names = formData.getAll('ownerName');
  const emails = formData.getAll('ownerEmail');
  if (names.length !== emails.length || names.length < 1 || names.length > ticketOwnerLimit) {
    return undefined;
  }
  const owners: { fullName: string; email: string }[] = [];
  for (let index = 0; index < names.length; index += 1) {
    const fullName = names[index];
    const email = emails[index];
    if (typeof fullName !== 'string' || typeof email !== 'string') {
      return undefined;
    }
    owners.push({ fullName, email });
  }
  return owners;
}

async function issueLocally(
  input: { partyId: string; offerName: string; owners: { fullName: string; email: string }[] },
  actorId: string,
): Promise<{ tickets: IssuedTicket[]; unsent: string[] }> {
  const tickets = await commitTicket(input, { role: 'user', actorId });
  const profile = (await currentAccounts()).profiles.find((item) => item.sub === actorId);
  const titles = await loadPartyTitles();
  const partyId = input.partyId.trim();
  const language: Locale = profile?.locale === 'pt' ? 'pt' : 'en';
  const unsent = await notifyTicketHolders({
    tickets,
    title: titles.get(partyId) ?? partyId,
    offerName: input.offerName,
    language,
  });
  return { tickets, unsent };
}

async function buyer(): Promise<{ role: 'user'; actorId: string } | PaymentNotice> {
  const sub = await currentAccountSub();
  if (!sub) {
    return 'not-signed-in';
  }
  const profile = (await currentAccounts()).profiles.find((item) => item.sub === sub);
  if (!profile || !accountCanPurchase(profile)) {
    return profile ? 'cannot-pay' : 'not-signed-in';
  }
  return { role: 'user', actorId: sub };
}

export async function issueTicketAction(formData: FormData): Promise<TicketActionResult> {
  if (rejected(formData)) {
    return { notice: 'cannot-pay' };
  }
  const actor = await buyer();
  if (typeof actor === 'string') {
    return { notice: actor };
  }
  try {
    const owners = ownersFrom(formData);
    if (!owners) {
      return { notice: 'owner-required' };
    }
    const input = { partyId: field(formData, 'partyId'), offerName: field(formData, 'offerName'), owners };
    const issued = apiOrigin()
      ? await callPrivate<{ tickets: IssuedTicket[]; unsent: string[] }>('issue-ticket', { input, caller: actor })
      : await issueLocally(input, actor.actorId);
    const first = issued.tickets[0];
    const ready = first !== undefined && issued.tickets.every((ticket) => ticket.validForEntry === true && /^ticket-[a-f0-9]{18}$/.test(ticket.id));
    if (!ready || !first) {
      return { notice: 'cannot-pay' };
    }
    return { notice: 'ticket-ready', ticketId: first.id, ...(issued.unsent.length > 0 ? { unsent: issued.unsent } : {}) };
  } catch (error) {
    return { notice: noticeFrom(error) };
  }
}
