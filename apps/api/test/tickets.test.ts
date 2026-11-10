import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import type { VerifiedSignIn } from 'tropical-nomads-shared';
import { api } from '../src/app.ts';
import { emptyAccounts, registerVerifiedAccount, saveDefaultBillingAddress, writeAccounts, type AccountFile } from '../src/accounts.ts';
import { readOperational } from '../src/operational.ts';
import { type PaymentCaller } from '../src/payments.ts';
import { commitTicket, createTicketSecret, issueTicket, listOwnTickets, readOwnTicket, type TicketParty } from '../src/tickets.ts';

process.env.TICKET_QR_KEY ??= '0123456789abcdef'.repeat(4);

const now = '2026-11-08T18:00:00.000Z';
const partyId = 'party-switched';
const buyerId = 'sub-ada';

function caller(actorId = buyerId, role: PaymentCaller['role'] = 'user'): PaymentCaller {
  return { role, actorId };
}

function signIn(username: string, overrides: Partial<VerifiedSignIn> = {}): VerifiedSignIn {
  return {
    sub: `sub-${username}`,
    provider: 'cognito',
    providerSubject: `sub-${username}`,
    email: `${username}@example.com`,
    emailVerified: true,
    username,
    givenName: username,
    familyName: 'Nomad',
    ...overrides,
  };
}

function billedFile(): AccountFile {
  const registered = registerVerifiedAccount(emptyAccounts(), signIn('ada'), [], now);
  return saveDefaultBillingAddress(
    registered,
    buyerId,
    { recipientName: 'Ada Nomad', line1: '1 Quay', city: 'Dublin', region: 'Leinster', postalCode: 'D01', country: 'IE' },
    now,
  );
}

function party(offers: TicketParty['offers']): TicketParty {
  return { id: partyId, offers, sourceId: '117713' };
}

function euroParty(capacity = 20): TicketParty {
  return party([{ name: 'Early', amount: 15, currency: 'EUR', capacity }]);
}

function emptyRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'tn-tickets-'));
  for (const name of ['payment-traces', 'orders', 'issued-tickets']) {
    writeFileSync(join(root, `${name}.json`), `${JSON.stringify({ schemaVersion: 1, records: [] })}\n`);
  }
  writeAccounts(billedFile(), root);
  return root;
}

function message(run: () => void): string {
  try {
    run();
    return '';
  } catch (error) {
    return error instanceof Error ? error.message : '';
  }
}

describe('tickets', () => {
  it('creates a secret that is not the event id and not the buyer id joined to it', () => {
    const ticketId = 'ticket-0123456789abcdef01';
    const secret = createTicketSecret(partyId, buyerId, ticketId, '117713');
    assert.match(secret, /^[0-9a-f]{32}$/);
    assert.notEqual(secret, partyId);
    assert.notEqual(secret, buyerId);
    assert.notEqual(secret, ticketId);
    assert.notEqual(secret, '117713');
    assert.notEqual(secret, `${partyId}${buyerId}`);
    assert.notEqual(secret, `${buyerId}${partyId}`);
    assert.notEqual(secret, createTicketSecret(partyId, buyerId, ticketId, '117713'));
  });

  it('refuses a profile with no billing address and writes nothing', async () => {
    const root = emptyRoot();
    writeAccounts(registerVerifiedAccount(emptyAccounts(), signIn('ada'), [], now), root);
    const eventsBefore = readFileSync(new URL('../../one-pager/public/data/events.json', import.meta.url), 'utf8');
    await assert.rejects(() => commitTicket({ partyId, offerName: 'Early' }, caller(), now, root, [euroParty()]), /billing address is required/);
    assert.equal(readOperational('issued-tickets', root).records.length, 0);
    assert.equal(readOperational('orders', root).records.length, 0);
    assert.equal(readOperational('payment-traces', root).records.length, 0);
    assert.equal(readFileSync(new URL('../../one-pager/public/data/events.json', import.meta.url), 'utf8'), eventsBefore);
  });

  it('stores a paid euro ticket and refuses a draft, another currency, and another buyer', async () => {
    const root = emptyRoot();
    const eventsBefore = readFileSync(new URL('../../one-pager/public/data/events.json', import.meta.url), 'utf8');
    await assert.rejects(() => commitTicket({ partyId: 'draft-party', offerName: 'Early' }, caller(), now, root), /event is not published/);
    assert.equal(readFileSync(new URL('../../one-pager/public/data/events.json', import.meta.url), 'utf8'), eventsBefore);
    assert.equal(readOperational('issued-tickets', root).records.length, 0);

    await assert.rejects(
      () => commitTicket({ partyId, offerName: 'Early' }, caller(), now, root, [party([{ name: 'Early', amount: 15, currency: 'USD' }])]),
      /offer is not for sale/,
    );
    await assert.rejects(
      () => commitTicket({ partyId, offerName: 'Early' }, caller(), now, root, [party([{ name: 'Early', amount: 15 }])]),
      /offer is not for sale/,
    );
    assert.equal(readOperational('issued-tickets', root).records.length, 0);

    const file = billedFile();
    const disabled = {
      ...file,
      profiles: file.profiles.map((profile) => ({ ...profile, status: 'disabled' as const })),
    };
    assert.throws(() => issueTicket(disabled, [], [], [], [euroParty()], { partyId, offerName: 'Early' }, caller(), now), /not allowed/);
    assert.throws(() => issueTicket(file, [], [], [], [euroParty()], { partyId, offerName: 'Early' }, caller(buyerId, 'door'), now), /not allowed/);
    assert.throws(() => issueTicket(file, [], [], [], [euroParty()], { partyId, offerName: 'Early' }, caller('admin-1', 'admin'), now), /not allowed/);

    await assert.rejects(
      () => commitTicket({ partyId, offerName: 'Early' }, caller(), now, root, [{ ...euroParty(), publication: 'draft' }]),
      /event is not published/,
    );
    const ticket = await commitTicket({ partyId, offerName: 'Early' }, caller(), now, root, [euroParty(1)]);
    assert.equal(ticket.validForEntry, true);
    assert.equal(ticket.buyerId, buyerId);
    assert.equal(ticket.partyId, partyId);
    assert.notEqual(ticket.secret, partyId);
    assert.notEqual(ticket.secret, `${partyId}${buyerId}`);
    assert.notEqual(ticket.secret, `${buyerId}${partyId}`);
    const stored = readOperational('issued-tickets', root).records[0] as { validForEntry: boolean; secret: string; secretBox?: string };
    assert.equal(stored.validForEntry, true);
    assert.equal(stored.secret, createHash('sha256').update(ticket.secret, 'utf8').digest('hex'));
    assert.equal(typeof stored.secretBox, 'string');
    assert.equal(JSON.stringify(stored).includes(`"${ticket.secret}"`), false);
    await assert.rejects(() => commitTicket({ partyId, offerName: 'Early' }, caller(), now, root, [euroParty(1)]), /sold out/);
    const trace = readOperational('payment-traces', root).records[0] as { status: string; currency: string; purpose: string; amount: number };
    assert.equal(trace.status, 'confirmed');
    assert.equal(trace.currency, 'EUR');
    assert.equal(trace.purpose, 'tickets');
    assert.equal(trace.amount, 15);
    const order = readOperational('orders', root).records[0] as { purpose: string; lines: { kind: string; quantity: number }[] };
    assert.equal(order.purpose, 'tickets');
    assert.equal(order.lines[0]?.kind, 'ticket');
    assert.equal(order.lines[0]?.quantity, 1);

    const missing = message(() => readOwnTicket(caller(), [ticket], 'ticket-missing'));
    const other = message(() => readOwnTicket(caller('sub-grace'), [ticket], ticket.id));
    assert.equal(missing, 'ticket was not found');
    assert.equal(other, missing);
    assert.equal(listOwnTickets(caller(), [ticket]).length, 1);
    assert.deepEqual(listOwnTickets(caller('sub-grace'), [ticket]), []);
    assert.throws(() => listOwnTickets(caller('sub-grace', 'door'), [ticket]), /ticket was not found/);

    const committed = readFileSync(new URL('../../../data/operational/issued-tickets.json', import.meta.url), 'utf8');
    assert.equal(JSON.parse(committed).records.length, 0);
    assert.equal(committed.includes(ticket.secret), false);
    assert.equal((await api.request('/issued-tickets')).status, 404);
    assert.equal((await api.request('/orders', { method: 'POST' })).status, 405);
    const source = readFileSync(new URL('../src/tickets.ts', import.meta.url), 'utf8');
    assert.equal(source.includes('markPaymentConfirmed'), false);
    assert.equal(source.includes('recordRefund'), false);
    assert.equal(source.includes("currency: 'EUR'"), true);
    const app = readFileSync(new URL('../src/app.ts', import.meta.url), 'utf8');
    assert.equal(app.includes('issued-tickets'), false);
  });
});
