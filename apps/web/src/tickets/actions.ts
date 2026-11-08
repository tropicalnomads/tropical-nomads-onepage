'use server';

import { accountCanPurchase, containsCardNumber } from 'tropical-nomads-shared';
import { readAccounts } from 'tropical-nomads-api/accounts';
import { commitTicket } from 'tropical-nomads-api/tickets';
import { currentAccountSub } from '../account/actions';
import type { PaymentNotice } from '../i18n/copy';

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
    default:
      return 'cannot-pay';
  }
}

async function buyer(): Promise<{ role: 'user'; actorId: string } | PaymentNotice> {
  const sub = await currentAccountSub();
  if (!sub) {
    return 'not-signed-in';
  }
  const profile = readAccounts().profiles.find((item) => item.sub === sub);
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
    const ticket = await commitTicket({ partyId: field(formData, 'partyId'), offerName: field(formData, 'offerName') }, actor);
    if (ticket.validForEntry !== false || !/^ticket-[a-f0-9]{18}$/.test(ticket.id)) {
      return { notice: 'cannot-pay' };
    }
    return { notice: 'pending-provider', ticketId: ticket.id };
  } catch (error) {
    return { notice: noticeFrom(error) };
  }
}
