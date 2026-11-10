import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { decideAccess, type IssuedTicket, type PaymentTrace, type VerifiedSignIn } from 'tropical-nomads-shared';
import { api } from '../src/app.ts';
import { emptyAccounts, registerVerifiedAccount, type AccountFile } from '../src/accounts.ts';
import {
  addGuest,
  checkInGuest,
  checkInTicket,
  createGuestList,
  eventRoster,
  inviteDoor,
  revokeDoor,
  scanTicket,
  searchRoster,
  type CheckInCaller,
} from '../src/check-in.ts';

const now = '2026-11-08T21:00:00.000Z';
const later = '2026-11-08T22:00:00.000Z';
const parties = ['party-a', 'party-b'];

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

function accounts(): AccountFile {
  const admin = registerVerifiedAccount(emptyAccounts(), signIn('admin'), [], now, { INITIAL_ADMIN_SUB: 'sub-admin' });
  const withBuyer = registerVerifiedAccount(admin, signIn('ada'), [], now);
  return registerVerifiedAccount(withBuyer, signIn('doe'), [], now);
}

function ticket(secret = 'not-the-party-secret', partyId = 'party-a', traceId = 'trace-1'): IssuedTicket {
  return {
    id: 'ticket-1',
    partyId,
    traceId,
    buyerId: 'sub-ada',
    secret,
    createdAt: now,
    validForEntry: false,
  };
}

function trace(status: PaymentTrace['status'], id = 'trace-1'): PaymentTrace {
  return { id, userId: 'sub-ada', amount: 15, currency: 'EUR', purpose: 'tickets', reference: 'order-1', status };
}

function order() {
  return {
    id: 'order-1',
    userId: 'sub-ada',
    purpose: 'tickets' as const,
    lines: [{ kind: 'ticket' as const, partyId: 'party-a', offerName: 'Early', quantity: 1 }],
    traceId: 'trace-1',
    createdAt: now,
  };
}

const admin: CheckInCaller = { role: 'admin', actorId: 'sub-admin' };
const door: CheckInCaller = { role: 'door', actorId: 'sub-doe' };
const buyer: CheckInCaller = { role: 'user', actorId: 'sub-ada' };

describe('check-in', () => {
  it('keeps a door invite on one event and lets an admin open without one', () => {
    const file = accounts();
    const invited = inviteDoor(file, [], admin, 'doe@example.com', ['party-a'], parties, now);
    assert.equal(invited.file.profiles.find((profile) => profile.sub === 'sub-doe')?.role, 'door');
    assert.equal(invited.invites[0]?.partyIds.includes('party-b'), false);
    const rosterA = eventRoster(invited.file, invited.invites, [], [ticket()], [order()], [trace('confirmed')], [], door, 'party-a', parties);
    assert.equal(rosterA.sold[0]?.name, 'ada Nomad');
    assert.equal(rosterA.sold[0]?.offerName, 'Early');
    assert.equal(JSON.stringify(rosterA).includes('not-the-party-secret'), false);
    assert.throws(() => eventRoster(invited.file, invited.invites, [], [], [], [], [], door, 'party-b', parties), /not allowed/);
    assert.equal(eventRoster(file, [], [], [], [], [], [], admin, 'party-b', parties).partyId, 'party-b');
    assert.throws(() => eventRoster(file, [], [], [], [], [], [], buyer, 'party-a', parties), /not allowed/);
    const revoked = revokeDoor(invited.file, invited.invites, admin, invited.invites[0]?.id ?? '', later);
    assert.equal(revoked.file.profiles.find((profile) => profile.sub === 'sub-doe')?.role, 'user');
    assert.throws(() => eventRoster(revoked.file, revoked.invites, [], [], [], [], [], door, 'party-a', parties), /not allowed/);
    assert.throws(() => inviteDoor(file, [], admin, 'doe@example.com', ['draft-party'], parties, now), /not published/);
  });

  it('checks a confirmed ticket in once, refuses unpaid and a second scan, and keeps the actor', () => {
    const invited = inviteDoor(accounts(), [], admin, 'doe@example.com', ['party-a'], parties, now);
    const sold = ticket();
    const first = scanTicket(invited.file, invited.invites, [sold], [trace('confirmed')], [], door, 'party-a', { id: sold.id, secret: sold.secret }, parties, now);
    assert.equal(first.outcome.admitted, true);
    assert.equal(first.outcome.buyerName, 'ada Nomad');
    assert.equal(first.outcome.checkIn?.actorId, 'sub-doe');
    assert.notEqual(first.outcome.checkIn?.actorId, sold.buyerId);
    const second = scanTicket(invited.file, invited.invites, [sold], [trace('confirmed')], first.checkIns, door, 'party-a', { id: sold.id, secret: sold.secret }, parties, later);
    assert.equal(second.outcome.admitted, false);
    assert.equal(second.outcome.reason, 'already used');
    const unpaid = scanTicket(invited.file, invited.invites, [sold], [trace('pending_provider')], [], door, 'party-a', { id: sold.id, secret: sold.secret }, parties, now);
    assert.equal(unpaid.outcome.admitted, false);
    assert.equal(unpaid.outcome.reason, 'unpaid');
    const badSecret = scanTicket(invited.file, invited.invites, [sold], [trace('confirmed')], [], door, 'party-a', { id: sold.id, secret: 'wrong-secret' }, parties, now);
    assert.equal(badSecret.outcome.admitted, false);
    assert.equal(badSecret.outcome.reason, 'unknown');
    const otherEvent = checkInTicket(invited.file, invited.invites, [sold], [trace('confirmed')], [], door, 'party-a', 'ticket-1', parties, now);
    assert.equal(otherEvent.outcome.admitted, true);
    const wrongParty = scanTicket(
      invited.file,
      invited.invites,
      [ticket(sold.secret, 'party-b')],
      [trace('confirmed')],
      [],
      door,
      'party-a',
      { id: 'ticket-1', secret: sold.secret },
      parties,
      now,
    );
    assert.equal(wrongParty.outcome.reason, 'wrong party');
    assert.throws(
      () => scanTicket(accounts(), [], [sold], [trace('confirmed')], [], buyer, 'party-a', { id: sold.id, secret: sold.secret }, parties, now),
      /not allowed/,
    );
    const byAdmin = checkInTicket(accounts(), [], [sold], [trace('confirmed')], [], admin, 'party-a', sold.id, parties, now);
    assert.equal(byAdmin.outcome.admitted, true);
    assert.equal(byAdmin.outcome.checkIn?.actorId, 'sub-admin');
  });

  it('lets an admin add a guest and lets door check that guest in once', () => {
    const invited = inviteDoor(accounts(), [], admin, 'doe@example.com', ['party-a'], parties, now);
    assert.throws(() => createGuestList(invited.file, [], door, 'party-a', 'Artists', parties, now), /not allowed/);
    const lists = createGuestList(invited.file, [], admin, 'party-a', 'Artists', parties, now);
    const withGuest = addGuest(invited.file, lists, admin, lists[0]?.id ?? '', 'Mina Souza', parties, now);
    const roster = eventRoster(invited.file, invited.invites, withGuest, [ticket()], [order()], [trace('pending_provider')], [], door, 'party-a', parties);
    assert.equal(roster.guests[0]?.name, 'Mina Souza');
    assert.equal(roster.sold[0]?.state, 'unpaid');
    assert.equal(JSON.stringify(roster).includes('secret'), false);
    const found = searchRoster(roster, 'mina', invited.file, [ticket()]);
    assert.equal(found.guests.length, 1);
    assert.equal(found.sold.length, 0);
    const other = eventRoster(invited.file, invited.invites, withGuest, [ticket('secret-b', 'party-b', 'trace-2')], [], [], [], admin, 'party-b', parties);
    const searched = searchRoster(other, 'mina', invited.file, []);
    assert.equal(searched.guests.length, 0);
    const guestId = withGuest[0]?.guests[0]?.id ?? '';
    const first = checkInGuest(invited.file, invited.invites, withGuest, [], door, 'party-a', guestId, parties, now);
    assert.equal(first.outcome.admitted, true);
    assert.equal(first.outcome.checkIn?.actorId, 'sub-doe');
    const second = checkInGuest(invited.file, invited.invites, withGuest, first.checkIns, door, 'party-a', guestId, parties, later);
    assert.equal(second.outcome.admitted, false);
    assert.equal(second.outcome.reason, 'already used');
    assert.equal(decideAccess({ action: 'create-party', role: 'door', actorId: 'sub-doe' }).effect, 'deny');
    assert.equal(decideAccess({ action: 'configure-event-tickets', role: 'door', actorId: 'sub-doe' }).effect, 'deny');
    assert.equal(decideAccess({ action: 'set-shop', role: 'door', actorId: 'sub-doe' }).effect, 'deny');
  });

  it('does not publish a draft or open a check-in route', async () => {
    const eventsBefore = readFileSync(new URL('../../one-pager/public/data/events.json', import.meta.url), 'utf8');
    const root = mkdtempSync(join(tmpdir(), 'tn-check-in-'));
    for (const name of ['door-invites', 'guest-lists', 'check-ins', 'payment-traces', 'issued-tickets', 'orders']) {
      writeFileSync(join(root, `${name}.json`), `${JSON.stringify({ schemaVersion: 1, records: [] })}\n`);
    }
    assert.throws(() => inviteDoor(accounts(), [], admin, 'doe@example.com', ['draft-party'], parties, now), /not published/);
    assert.equal(readFileSync(new URL('../../one-pager/public/data/events.json', import.meta.url), 'utf8'), eventsBefore);
    assert.equal((await api.request('/check-ins')).status, 404);
    assert.equal((await api.request('/guest-lists', { method: 'POST' })).status, 405);
    const source = readFileSync(new URL('../src/check-in.ts', import.meta.url), 'utf8');
    assert.equal(source.includes('markPaymentConfirmed'), false);
    assert.equal(source.includes('recordRefund'), false);
    const committed = readFileSync(new URL('../../../data/operational/guest-lists.json', import.meta.url), 'utf8');
    assert.equal(JSON.parse(committed).records.length, 0);
    assert.equal(root.includes(`${join('public', 'data')}`), false);
  });
});
