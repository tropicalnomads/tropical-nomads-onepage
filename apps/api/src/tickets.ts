import { randomBytes } from 'node:crypto';
import {
  accountCanPurchase,
  decideAccess,
  loteOffers,
  loteStatusFor,
  normalizeAccountEmail,
  parseIssuedTicket,
  parseOrder,
  parsePaymentTrace,
  parseTicketOwners,
  qrPayloadText,
  readTicketOffers,
  ticketSecretMatches,
  type IssuedTicket,
  type Order,
  type PaymentTrace,
} from 'tropical-nomads-shared';
import { loadAccounts, readAccounts, type AccountFile } from './accounts.ts';
import { readPartyCatalog } from './catalog.ts';
import { usingDatabase } from './database.ts';
import { operationalDirectory, readOperational, updateOperational, writeOperational } from './operational.ts';
import { startTicketPayment, type PaymentCaller } from './payments.ts';
import { publishedEventsFrom, type PublishedEvent } from './published.ts';
import { queueDatabase, readStoredCatalog, readStoredCollection, writeStoredState } from './sql-store.ts';
import { hashTicketSecret, openTicketSecret, sealStoredTicket } from './ticket-seal.ts';

export interface TicketParty {
  id: string;
  offers?: unknown;
  sourceId?: string;
  publication?: 'draft' | 'published';
}

export interface IssueInput {
  partyId: string;
  offerName: string;
  owners: unknown;
}

export interface TicketSale {
  traces: PaymentTrace[];
  orders: Order[];
  tickets: IssuedTicket[];
  issued: IssuedTicket[];
  trace: PaymentTrace;
  order: Order;
}

export interface TicketView {
  id: string;
  title: string;
  offerName: string;
  ownerName: string;
  createdAt: string;
  validForEntry: boolean;
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
  if (!parsed.ok) {
    throw new Error('payment trace is not stored');
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
  if (!parsed.ok) {
    throw new Error('ticket was not stored');
  }
  return parsed.value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function openStoredTicket(input: unknown): IssuedTicket {
  if (!isRecord(input) || typeof input.secretBox !== 'string') {
    return storedTicket(input);
  }
  const plain = openTicketSecret(input.secretBox);
  const hash = typeof input.secret === 'string' ? input.secret : '';
  if (!ticketSecretMatches(hash, hashTicketSecret(plain))) {
    throw new Error('ticket was not stored');
  }
  const opened: Record<string, unknown> = { ...input, secret: plain };
  delete opened.secretBox;
  return storedTicket(opened);
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

function chargeAmount(unit: number, count: number): number {
  const cents = Math.round(unit * 100);
  if (!Number.isInteger(cents) || cents <= 0 || count <= 0) {
    throw new Error('amount is not valid');
  }
  const total = cents * count;
  if (total <= 0 || total > 10_000_000) {
    throw new Error('amount is not valid');
  }
  return total / 100;
}

/**
 * Issue one paid ticket for each owner. Writes nothing. Currency is euro. The server marks the trace confirmed.
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
  const partyId = input.partyId.trim();
  const party = parties.find((item) => item.id === partyId);
  if (!party || party.publication === 'draft') {
    throw new Error('event is not published');
  }
  const offerName = offerNameOf(input.offerName);
  const catalog = loteOffers(readTicketOffers(party.offers));
  const offer = catalog.find((item) => item.name === offerName);
  if (!offer) {
    throw new Error('offer is not for sale');
  }
  const soldByName: Record<string, number> = {};
  for (const order of orders) {
    for (const line of order.lines) {
      if (line.kind !== 'ticket' || line.partyId !== party.id) {
        continue;
      }
      soldByName[line.offerName] = (soldByName[line.offerName] ?? 0) + line.quantity;
    }
  }
  const status = loteStatusFor(catalog, offer.name, soldByName, new Date(now));
  switch (status) {
    case 'on-sale':
      break;
    case 'sold-out':
      throw new Error('offer is sold out');
    case 'scheduled':
    case 'ended':
    case undefined:
      throw new Error('offer is not for sale');
    default: {
      const unexpected: never = status;
      throw new Error(unexpected);
    }
  }
  const parsedOwners = parseTicketOwners(input.owners);
  if (!parsedOwners.ok) {
    throw new Error('owner is required');
  }
  const owners = parsedOwners.value;
  const sold = soldByName[offer.name] ?? 0;
  if (sold + owners.length > offer.capacity) {
    throw new Error('offer is sold out');
  }
  const orderId = newId('order');
  const started = startTicketPayment(
    file,
    traces,
    { userId, amount: chargeAmount(offer.amount, owners.length), currency: 'EUR', reference: orderId },
    caller,
  );
  if (started.trace.status !== 'pending_provider' || started.trace.currency !== 'EUR' || started.trace.purpose !== 'tickets') {
    throw new Error('payment trace is not pending');
  }
  const trace = { ...started.trace, status: 'confirmed' as const };
  const confirmedTraces = started.traces.map((item) => (item.id === trace.id ? trace : item));
  const orderDraft = {
    id: orderId,
    userId,
    purpose: 'tickets' as const,
    lines: [{ kind: 'ticket' as const, partyId: party.id, offerName: offer.name, quantity: owners.length }],
    traceId: trace.id,
    createdAt: now,
  };
  const profileIds = file.profiles.map((item) => item.sub);
  const partyIds = parties.map((item) => item.id);
  const traceIds = confirmedTraces.map((item) => item.id);
  const parsedOrder = parseOrder(orderDraft, { profileIds, partyIds, traceIds });
  if (!parsedOrder.ok) {
    throw new Error('ticket was not issued');
  }
  const issued: IssuedTicket[] = [];
  for (const owner of owners) {
    const ticketId = newId('ticket');
    const secret = createTicketSecret(party.id, userId, ticketId, party.sourceId);
    const parsedTicket = parseIssuedTicket(
      {
        id: ticketId,
        partyId: party.id,
        traceId: trace.id,
        buyerId: userId,
        secret,
        createdAt: now,
        validForEntry: true,
        ownerName: owner.fullName,
        ownerEmail: owner.email,
      },
      { profileIds, partyIds, traceIds },
    );
    if (!parsedTicket.ok || !parsedTicket.value.ownerName || !parsedTicket.value.ownerEmail) {
      throw new Error('ticket was not issued');
    }
    const payload = qrPayloadText({ id: parsedTicket.value.id, secret: parsedTicket.value.secret });
    if (!payload.ok) {
      throw new Error('ticket was not issued');
    }
    issued.push(parsedTicket.value);
  }
  return {
    traces: confirmedTraces,
    orders: [...orders, parsedOrder.value],
    tickets: [...tickets, ...issued],
    issued,
    trace,
    order: parsedOrder.value,
  };
}

export function readIssuedTickets(root = operationalDirectory()): IssuedTicket[] {
  return readOperational('issued-tickets', root).records.map(openStoredTicket);
}

export function readOrders(root = operationalDirectory()): Order[] {
  return readOperational('orders', root).records.map(storedOrder);
}

export async function loadIssuedTickets(root?: string): Promise<IssuedTicket[]> {
  if (usingDatabase(root)) {
    return (await readStoredCollection('issued-tickets')).records.map(openStoredTicket);
  }
  return readIssuedTickets(root ?? operationalDirectory());
}

export function summarizeTicketSales(orders: readonly Order[]): { partyId: string; offerName: string; sold: number }[] {
  const counts = new Map<string, { partyId: string; offerName: string; sold: number }>();
  for (const order of orders) {
    for (const line of order.lines) {
      if (line.kind !== 'ticket') {
        continue;
      }
      const key = `${line.partyId}\n${line.offerName}`;
      const current = counts.get(key);
      if (current) {
        current.sold += line.quantity;
      } else {
        counts.set(key, { partyId: line.partyId, offerName: line.offerName, sold: line.quantity });
      }
    }
  }
  return [...counts.values()];
}

export async function loadOrders(root?: string): Promise<Order[]> {
  if (usingDatabase(root)) {
    return (await readStoredCollection('orders')).records.map(storedOrder);
  }
  return readOrders(root ?? operationalDirectory());
}

export async function loadPublishedParties(): Promise<TicketParty[]> {
  if (!usingDatabase()) {
    return publishedParties();
  }
  return publishedEventsFrom(await readStoredCatalog('events')).events.map(partyFromPublished);
}

export async function loadPartyTitles(): Promise<Map<string, string>> {
  if (!usingDatabase()) {
    return publishedPartyTitles();
  }
  const titles = new Map<string, string>();
  for (const event of publishedEventsFrom(await readStoredCatalog('events')).events) {
    if (event.id.trim() !== '' && event.title.trim() !== '') {
      titles.set(event.id, event.title);
    }
  }
  return titles;
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

export function listOwnTickets(caller: PaymentCaller, tickets: readonly IssuedTicket[], holderEmail = ''): IssuedTicket[] {
  const userId = requireOwnReader(caller);
  const holder = normalizeAccountEmail(holderEmail);
  return tickets
    .filter((ticket) => ticket.buyerId === userId || (holder !== '' && ticket.ownerEmail === holder))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function readOwnTicket(caller: PaymentCaller, tickets: readonly IssuedTicket[], ticketId: string, holderEmail = ''): IssuedTicket {
  const ticket = listOwnTickets(caller, tickets, holderEmail).find((item) => item.id === ticketId.trim());
  if (!ticket) {
    throw new Error('ticket was not found');
  }
  return ticket;
}

export function ownTicketPayload(caller: PaymentCaller, tickets: readonly IssuedTicket[], ticketId: string, holderEmail = ''): string {
  const ticket = readOwnTicket(caller, tickets, ticketId, holderEmail);
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
  holderEmail = '',
): TicketView[] {
  return listOwnTickets(caller, tickets, holderEmail).map((ticket) => {
    const order = orders.find((item) => item.traceId === ticket.traceId && item.userId === ticket.buyerId);
    const line = order?.lines.find((item) => item.kind === 'ticket' && item.partyId === ticket.partyId);
    const offerName = line !== undefined && line.kind === 'ticket' ? line.offerName : '';
    return {
      id: ticket.id,
      title: titles.get(ticket.partyId) ?? ticket.partyId,
      offerName,
      ownerName: ticket.ownerName ?? '',
      createdAt: ticket.createdAt,
      validForEntry: ticket.validForEntry,
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
function issuedFrom(records: readonly unknown[], ids: readonly string[]): IssuedTicket[] {
  const opened = records.map(openStoredTicket);
  const found: IssuedTicket[] = [];
  for (const id of ids) {
    const ticket = opened.find((item) => item.id === id);
    if (!ticket) {
      throw new Error('ticket was not stored');
    }
    found.push(ticket);
  }
  return found;
}

export function commitTicket(
  input: IssueInput,
  caller: PaymentCaller,
  now = new Date().toISOString(),
  root?: string,
  parties?: readonly TicketParty[],
): Promise<IssuedTicket[]> {
  if (usingDatabase(root)) {
    return commitTicketOnDatabase(input, caller, now, parties);
  }
  const directory = root ?? operationalDirectory();
  const catalog = parties ?? publishedParties();
  let issuedIds: string[] = [];
  return updateOperational(
    'issued-tickets',
    (current) => {
      const sale = issueTicket(
        readAccounts(directory),
        readOperational('payment-traces', directory).records.map(storedTrace),
        readOperational('orders', directory).records.map(storedOrder),
        current.records.map(openStoredTicket),
        catalog,
        input,
        caller,
        now,
      );
      writeOperational('payment-traces', { schemaVersion: 1, records: sale.traces }, directory);
      writeOperational('orders', { schemaVersion: 1, records: sale.orders }, directory);
      issuedIds = sale.issued.map((ticket) => ticket.id);
      return { schemaVersion: 1, records: sale.tickets.map((ticket) => sealStoredTicket(ticket)) };
    },
    directory,
  ).then((file) => issuedFrom(file.records, issuedIds));
}

async function commitTicketOnDatabase(
  input: IssueInput,
  caller: PaymentCaller,
  now: string,
  parties?: readonly TicketParty[],
): Promise<IssuedTicket[]> {
  return queueDatabase(async () => {
    const accounts = await loadAccounts();
    const traces = (await readStoredCollection('payment-traces')).records.map(storedTrace);
    const orders = (await readStoredCollection('orders')).records.map(storedOrder);
    const tickets = (await readStoredCollection('issued-tickets')).records.map(openStoredTicket);
    const catalog = parties ?? (await loadPublishedParties());
    const sale = issueTicket(accounts, traces, orders, tickets, catalog, input, caller, now);
    await writeStoredState({
      collections: {
        'payment-traces': { schemaVersion: 1, records: sale.traces },
        orders: { schemaVersion: 1, records: sale.orders },
        'issued-tickets': { schemaVersion: 1, records: sale.tickets.map((ticket) => sealStoredTicket(ticket)) },
      },
    });
    return issuedFrom((await readStoredCollection('issued-tickets')).records, sale.issued.map((ticket) => ticket.id));
  });
}
