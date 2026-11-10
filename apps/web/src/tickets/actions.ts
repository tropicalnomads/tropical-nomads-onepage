'use server';

import { accountCanPurchase, containsCardNumber, type IssuedTicket } from 'tropical-nomads-shared';
import { commitTicket } from 'tropical-nomads-api/tickets';
import { currentAccountSub } from '../account/actions';
import { apiOrigin } from '../api-origin.ts';
import type { PaymentNotice } from '../i18n/copy';
import { callPrivate, currentAccounts } from '../remote-store.ts';

export interface TicketActionResult {
  notice: PaymentNotice;
  ticketId?: string;
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
    default:
      return 'cannot-pay';
  }
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
    const input = { partyId: field(formData, 'partyId'), offerName: field(formData, 'offerName') };
    const ticket = apiOrigin() ? await callPrivate<IssuedTicket>('issue-ticket', { input, caller: actor }) : await commitTicket(input, actor);
    if (ticket.validForEntry !== true || !/^ticket-[a-f0-9]{18}$/.test(ticket.id)) {
      return { notice: 'cannot-pay' };
    }
    return { notice: 'ticket-ready', ticketId: ticket.id };
  } catch (error) {
    return { notice: noticeFrom(error) };
  }
}
