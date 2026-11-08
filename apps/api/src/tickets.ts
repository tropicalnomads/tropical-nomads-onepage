import { randomBytes } from 'node:crypto';
import {
  accountCanPurchase,
  decideAccess,
  euroTicketOffers,
  parseIssuedTicket,
  parseOrder,
  parsePaymentTrace,
  qrPayloadText,
  readTicketOffers,
  type IssuedTicket,
  type Order,
  type PaymentTrace,
} from 'tropical-nomads-shared';
import { readAccounts, type AccountFile } from './accounts.ts';
import { readPartyCatalog } from './catalog.ts';
import { operationalDirectory, readOperational, updateOperational, writeOperational } from './operational.ts';
import { startTicketPayment, type PaymentCaller } from './payments.ts';
import type { PublishedEvent } from './published.ts';

export interface TicketParty {
  id: string;
  offers?: unknown;
  sourceId?: string;
}

export interface IssueInput {
  partyId: string;
  offerName: string;
}

export interface TicketSale {
  traces: PaymentTrace[];
  orders: Order[];
  tickets: IssuedTicket[];
  ticket: IssuedTicket;
  trace: PaymentTrace;
  order: Order;
}

export interface TicketView {
  id: string;
  title: string;
  offerName: string;
  createdAt: string;
}

export function partyFromPublished(event: PublishedEvent): TicketParty {
  const sourceId = event.source?.id;
  return {
    id: event.id,
    ...(event.offers === undefined ? {} : { offers: event.offers }),
    ...(sourceId === undefined ? {} : { sourceId: String(sourceId) }),
  };
}

export function publishedParties(): TicketParty[] {
  return readPartyCatalog().events.map(partyFromPublished);
}

/**
 * A random secret. It is not the party id, the buyer id, or those two strings joined.
 */
export function createTicketSecret(partyId: string, buyerId: string, ticketId: string, sourceId?: string): string {
  const banned = new Set([partyId, buyerId, ticketId, `${partyId}${buyerId}`, `${buyerId}${partyId}`]);
  if (sourceId !== undefined && sourceId !== '') {
    banned.add(sourceId);
  }
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const secret = randomBytes(16).toString('hex');
    if (!banned.has(secret)) {
      return secret;
    }
  }
  throw new Error('ticket was not issued');
}

function newId(prefix: string): string {
  return `${prefix}-${randomBytes(9).toString('hex')}`;
}

function storedTrace(input: unknown): PaymentTrace {
  const parsed = parsePaymentTrace(input);
  if (!parsed.ok || parsed.value.status !== 'pending_provider') {
    throw new Error('payment trace is not pending');
  }
  return parsed.value;
}

function storedOrder(input: unknown): Order {
  const parsed = parseOrder(input);
  if (!parsed.ok) {
    throw new Error('order is not stored');
  }
  return parsed.value;
}

function storedTicket(input: unknown): IssuedTicket {
  const parsed = parseIssuedTicket(input);
  if (!parsed.ok || parsed.value.validForEntry !== false) {
    throw new Error('ticket was not stored');
  }
  return parsed.value;
}

function requireSelf(caller: PaymentCaller): string {
  const decision = decideAccess({
    action: 'use-payment',
    role: caller.role,
    actorId: caller.actorId,
    subjectId: caller.actorId,
  });
  if (decision.effect !== 'allow' || decision.actorId !== caller.actorId) {
    throw new Error('payment is not allowed');
  }
  return decision.actorId;
}

function offerNameOf(value: string): string {
  const name = value.trim();
  if (name === '' || name.length > 80 || /[\u0000-\u001f]/.test(name)) {
    throw new Error('offer is not for sale');
  }
  return name;
}

/**
 * Issue one unpaid ticket. Writes nothing. Currency is euro. The trace stays pending.
 */
export function issueTicket(
  file: AccountFile,
  traces: readonly PaymentTrace[],
  orders: readonly Order[],
  tickets: readonly IssuedTicket[],
  parties: readonly TicketParty[],
  input: IssueInput,
  caller: PaymentCaller,
  now: string,
): TicketSale {
  const userId = requireSelf(caller);
  const profile = file.profiles.find((item) => item.sub === userId);
  if (!profile || !accountCanPurchase(profile)) {
    throw new Error('payment is not allowed');
  }
  if (!profile.billingAddressId || !file.billingAddresses.some((address) => address.id === profile.billingAddressId)) {
    throw new Error('billing address is required');
  }
  const partyId = input.partyId.trim();
  const party = parties.find((item) => item.id === partyId);
  if (!party) {
    throw new Error('event is not published');
  }
  const offerName = offerNameOf(input.offerName);
  const offer = euroTicketOffers(readTicketOffers(party.offers)).find((item) => item.name === offerName);
  if (!offer) {
    throw new Error('offer is not for sale');
  }
  const orderId = newId('order');
  const ticketId = newId('ticket');
  const secret = createTicketSecret(party.id, userId, ticketId, party.sourceId);
  const started = startTicketPayment(
    file,
    traces,
    { userId, amount: offer.amount, currency: 'EUR', reference: orderId },
    caller,
  );
  if (started.trace.status !== 'pending_provider' || started.trace.currency !== 'EUR' || started.trace.purpose !== 'tickets') {
    throw new Error('payment trace is not pending');
  }
  const orderDraft = {
    id: orderId,
    userId,
    purpose: 'tickets' as const,
    lines: [{ kind: 'ticket' as const, partyId: party.id, offerName: offer.name, quantity: 1 }],
    traceId: started.trace.id,
    createdAt: now,
  };
  const ticketDraft = {
    id: ticketId,
    partyId: party.id,
    traceId: started.trace.id,
    buyerId: userId,
    secret,
    createdAt: now,
    validForEntry: false as const,
  };
  const profileIds = file.profiles.map((item) => item.sub);
  const partyIds = parties.map((item) => item.id);
  const traceIds = started.traces.map((item) => item.id);
  const parsedOrder = parseOrder(orderDraft, { profileIds, partyIds, traceIds });
  if (!parsedOrder.ok) {
    throw new Error('ticket was not issued');
  }
  const parsedTicket = parseIssuedTicket(ticketDraft, { profileIds, partyIds, traceIds });
  if (!parsedTicket.ok) {
    throw new Error('ticket was not issued');
  }
  const payload = qrPayloadText({ id: parsedTicket.value.id, secret: parsedTicket.value.secret });
  if (!payload.ok) {
    throw new Error('ticket was not issued');
  }
  return {
    traces: started.traces,
    orders: [...orders, parsedOrder.value],
    tickets: [...tickets, parsedTicket.value],
    ticket: parsedTicket.value,
    trace: started.trace,
    order: parsedOrder.value,
  };
}

export function readIssuedTickets(root = operationalDirectory()): IssuedTicket[] {
  return readOperational('issued-tickets', root).records.map(storedTicket);
}

export function readOrders(root = operationalDirectory()): Order[] {
  return readOperational('orders', root).records.map(storedOrder);
}

function requireOwnReader(caller: PaymentCaller): string {
  const decision = decideAccess({
    action: 'read-own-purchases',
    role: caller.role,
    actorId: caller.actorId,
    subjectId: caller.actorId,
  });
  if (decision.effect !== 'allow' || decision.actorId !== caller.actorId) {
    throw new Error('ticket was not found');
  }
  return decision.actorId;
}

export function listOwnTickets(caller: PaymentCaller, tickets: readonly IssuedTicket[]): IssuedTicket[] {
  const userId = requireOwnReader(caller);
  return tickets
    .filter((ticket) => ticket.buyerId === userId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function readOwnTicket(caller: PaymentCaller, tickets: readonly IssuedTicket[], ticketId: string): IssuedTicket {
  const ticket = listOwnTickets(caller, tickets).find((item) => item.id === ticketId.trim());
  if (!ticket) {
    throw new Error('ticket was not found');
  }
  return ticket;
}

export function ownTicketPayload(caller: PaymentCaller, tickets: readonly IssuedTicket[], ticketId: string): string {
  const ticket = readOwnTicket(caller, tickets, ticketId);
  const payload = qrPayloadText({ id: ticket.id, secret: ticket.secret });
  if (!payload.ok) {
    throw new Error('ticket was not found');
  }
  return payload.value;
}

export function ownTicketViews(
  caller: PaymentCaller,
  tickets: readonly IssuedTicket[],
  orders: readonly Order[],
  titles: ReadonlyMap<string, string>,
): TicketView[] {
  return listOwnTickets(caller, tickets).map((ticket) => {
    const order = orders.find((item) => item.traceId === ticket.traceId && item.userId === ticket.buyerId);
    const line = order?.lines.find((item) => item.kind === 'ticket' && item.partyId === ticket.partyId);
    const offerName = line !== undefined && line.kind === 'ticket' ? line.offerName : '';
    return {
      id: ticket.id,
      title: titles.get(ticket.partyId) ?? ticket.partyId,
      offerName,
      createdAt: ticket.createdAt,
    };
  });
}

export function publishedPartyTitles(): Map<string, string> {
  const titles = new Map<string, string>();
  for (const event of readPartyCatalog().events) {
    if (event.id.trim() !== '' && event.title.trim() !== '') {
      titles.set(event.id, event.title);
    }
  }
  return titles;
}

/**
 * Persist a parsed sale. A failed check writes nothing.
 * The ticket is returned only after it is read back from the private store.
 */
export function commitTicket(
  input: IssueInput,
  caller: PaymentCaller,
  now = new Date().toISOString(),
  root = operationalDirectory(),
  parties?: readonly TicketParty[],
): Promise<IssuedTicket> {
  const catalog = parties ?? publishedParties();
  let ticketId = '';
  return updateOperational(
    'issued-tickets',
    (current) => {
      const sale = issueTicket(
        readAccounts(root),
        readOperational('payment-traces', root).records.map(storedTrace),
        readOperational('orders', root).records.map(storedOrder),
        current.records.map(storedTicket),
        catalog,
        input,
        caller,
        now,
      );
      writeOperational('payment-traces', { schemaVersion: 1, records: sale.traces }, root);
      writeOperational('orders', { schemaVersion: 1, records: sale.orders }, root);
      ticketId = sale.ticket.id;
      return { schemaVersion: 1, records: sale.tickets };
    },
    root,
  ).then((file) => {
    const ticket = file.records.map(storedTicket).find((item) => item.id === ticketId);
    if (!ticket) {
      throw new Error('ticket was not stored');
    }
    return ticket;
  });
}
