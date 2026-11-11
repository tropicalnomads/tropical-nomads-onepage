import { cookies } from 'next/headers';
import type { CheckIn, DoorInvite, GuestList, IssuedTicket, Order, PaymentTrace } from 'tropical-nomads-shared';
import { loadAccounts, loadPublishedEventIds, type AccountFile } from 'tropical-nomads-api/accounts';
import { loadCheckIns, loadDoorInvites, loadGuestLists } from 'tropical-nomads-api/check-in';
import { loadTraces } from 'tropical-nomads-api/payments';
import { loadIssuedTickets, loadOrders, loadPartyTitles, loadPublishedParties, type TicketParty } from 'tropical-nomads-api/tickets';
import { sealPayload, sessionCookieName } from './account/session.ts';
import { apiOrigin } from './api-origin.ts';

export interface AccountSnapshot {
  accounts: AccountFile;
  tickets: IssuedTicket[];
  orders: Order[];
  invites: DoorInvite[];
  guestLists: GuestList[];
  checkIns: CheckIn[];
  traces: PaymentTrace[];
  parties: TicketParty[];
  eventIds: string[];
  titles: [string, string][];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function callPrivate<T>(action: string, input: unknown = {}): Promise<T> {
  const origin = apiOrigin();
  if (!origin) {
    throw new Error('api is not configured');
  }
  const jar = await cookies();
  const session = jar.get(sessionCookieName)?.value;
  const token = sealPayload({ action, input }, 60);
  const response = await fetch(`${origin}/private`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(session ? { cookie: `${sessionCookieName}=${encodeURIComponent(session)}` } : {}),
    },
    body: JSON.stringify({ token }),
    cache: 'no-store',
  });
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error(response.status === 413 ? 'payload is too large' : 'request failed');
  }
  if (!response.ok || !isRecord(body) || body.ok !== true) {
    const error = isRecord(body) && typeof body.error === 'string' ? body.error : response.status === 413 ? 'payload is too large' : 'request failed';
    throw new Error(error);
  }
  return body.result as T;
}

export async function loadSnapshot(): Promise<AccountSnapshot> {
  if (apiOrigin()) {
    return callPrivate<AccountSnapshot>('snapshot');
  }
  const titles = await loadPartyTitles();
  const [accounts, tickets, orders, invites, guestLists, checkIns, traces, parties, eventIds] = await Promise.all([
    loadAccounts(),
    loadIssuedTickets(),
    loadOrders(),
    loadDoorInvites(),
    loadGuestLists(),
    loadCheckIns(),
    loadTraces(),
    loadPublishedParties(),
    loadPublishedEventIds(),
  ]);
  return { accounts, tickets, orders, invites, guestLists, checkIns, traces, parties, eventIds, titles: [...titles.entries()] };
}

export async function currentAccounts(): Promise<AccountFile> {
  if (apiOrigin()) {
    return (await callPrivate<AccountSnapshot>('snapshot')).accounts;
  }
  return loadAccounts();
}
