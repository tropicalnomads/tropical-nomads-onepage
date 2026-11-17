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
  removeGuest,
  updateGuest,
  checkInTicket,
  configureGuestLists,
  createGuestList,
  ensureDefaultGuestLists,
  eventRoster,
  inviteDoor,
  publicGuestListOffers,
  readGuestListConfigs,
  revokeDoor,
  scanTicket,
  searchRoster,
  type CheckInCaller,
  type GuestListSaveInput,
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

function defaultInputs(lists: readonly { id: string; name: string }[]): GuestListSaveInput[] {
  return ['DJ', 'Crew'].map((name) => ({
    id: lists.find((list) => list.name === name)?.id ?? '',
    name,
    amount: '0',
    channel: 'door',
    capacity: '',
  }));
}

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

  it('seeds DJ and Crew, keeps a door price off the public list, and refuses a bad change', () => {
    const file = accounts();
    const seeded = ensureDefaultGuestLists([], 'party-a', now);
    assert.deepEqual(
      seeded.map((list) => list.name),
      ['DJ', 'Crew'],
    );
    assert.equal(seeded.every((list) => list.locked && list.amount === 0 && list.channel === 'door' && list.guests.length === 0), true);
    const again = ensureDefaultGuestLists(seeded, 'party-a', later);
    assert.equal(again.length, 2);
    assert.equal(again[0]?.id, seeded[0]?.id);
    const configs = readGuestListConfigs([
      ...defaultInputs(seeded),
      { id: '', name: 'Friends', amount: '10', channel: 'door', capacity: '' },
      { id: '', name: 'Online', amount: '12.5', channel: 'online', capacity: '4' },
      { id: '', name: 'Comp', amount: '', channel: 'online', capacity: '3' },
    ]);
    assert.throws(() => configureGuestLists(file, seeded, door, 'party-a', configs, [], {}, now), /not allowed/);
    const priced = configureGuestLists(file, seeded, admin, 'party-a', configs, [], {}, now);
    const friends = priced.find((list) => list.name === 'Friends');
    const online = priced.find((list) => list.name === 'Online');
    const comp = priced.find((list) => list.name === 'Comp');
    assert.equal(friends?.amount, 10);
    assert.equal(friends?.channel, 'door');
    assert.equal(online?.capacity, 4);
    assert.equal(comp?.amount, 0);
    const published = publicGuestListOffers(priced);
    assert.deepEqual(
      published.map((offer) => offer.name),
      ['Online', 'Comp'],
    );
    assert.equal(JSON.stringify(published).includes('Friends'), false);
    const withGuest = addGuest(file, priced, admin, friends?.id ?? '', 'Mina Souza', now);
    assert.equal(JSON.stringify(publicGuestListOffers(withGuest)).includes('Mina Souza'), false);
    const roster = eventRoster(file, [], withGuest, [], [], [], [], admin, 'party-a', parties);
    assert.equal(roster.lists.find((list) => list.name === 'Friends')?.amount, 10);
    assert.throws(
      () => configureGuestLists(file, withGuest, admin, 'party-a', readGuestListConfigs(defaultInputs(withGuest)), [], {}, now),
      /not stored/,
    );
    assert.throws(
      () =>
        configureGuestLists(
          file,
          priced,
          admin,
          'party-a',
          readGuestListConfigs(defaultInputs(priced).map((item) => (item.name === 'DJ' ? { ...item, amount: '5' } : item))),
          [],
          {},
          now,
        ),
      /not stored/,
    );
    assert.throws(
      () => configureGuestLists(file, priced, admin, 'party-a', readGuestListConfigs([...defaultInputs(priced), { id: '', name: 'Early', amount: '8', channel: 'online', capacity: '2' }]), ['Early'], {}, now),
      /not stored/,
    );
    assert.throws(
      () =>
        configureGuestLists(
          file,
          priced,
          admin,
          'party-a',
          readGuestListConfigs([
            ...defaultInputs(priced),
            { id: friends?.id ?? '', name: 'Friends', amount: '10', channel: 'door', capacity: '' },
            { id: online?.id ?? '', name: 'Online', amount: '12.5', channel: 'online', capacity: '1' },
            { id: comp?.id ?? '', name: 'Comp', amount: '0', channel: 'online', capacity: '3' },
          ]),
          [],
          { Online: 2 },
          now,
        ),
      /not stored/,
    );
  });

  it('edits a guest note, keeps it off the public offer, and refuses to remove a checked-in guest', () => {
    const file = accounts();
    const seeded = ensureDefaultGuestLists([], 'party-a', now);
    const priced = configureGuestLists(
      file,
      seeded,
      admin,
      'party-a',
      readGuestListConfigs([...defaultInputs(seeded), { id: '', name: 'Friends', amount: '0', channel: 'door', capacity: '' }]),
      [],
      {},
      now,
    );
    const listId = priced.find((list) => list.name === 'Friends')?.id ?? '';
    const withGuest = addGuest(file, priced, admin, listId, 'Mina Souza', now, { email: 'mina@example.com', observation: 'Arrives late' });
    const guestId = withGuest.find((list) => list.id === listId)?.guests[0]?.id ?? '';
    assert.equal(withGuest.find((list) => list.id === listId)?.guests[0]?.email, 'mina@example.com');
    const edited = updateGuest(file, withGuest, admin, listId, guestId, { name: 'Mina Souza', observation: 'VIP' });
    const person = edited.find((list) => list.id === listId)?.guests[0];
    assert.equal(person?.observation, 'VIP');
    assert.equal(person?.email, undefined);
    const roster = eventRoster(file, [], edited, [], [], [], [], admin, 'party-a', parties);
    assert.equal(roster.guests[0]?.observation, 'VIP');
    const offers = JSON.stringify(publicGuestListOffers(edited));
    assert.equal(offers.includes('mina@example.com'), false);
    assert.equal(offers.includes('VIP'), false);
    assert.equal(offers.includes('Mina Souza'), false);
    const invited = inviteDoor(file, [], admin, 'doe@example.com', ['party-a'], parties, now);
    assert.throws(() => updateGuest(invited.file, edited, door, listId, guestId, { name: 'Other' }), /not allowed/);
    assert.throws(() => removeGuest(invited.file, edited, [], door, listId, guestId), /not allowed/);
    const removed = removeGuest(invited.file, edited, [], admin, listId, guestId);
    assert.equal(removed.find((list) => list.id === listId)?.guests.length, 0);
    const checked = checkInGuest(invited.file, invited.invites, edited, [], door, 'party-a', guestId, parties, now);
    assert.equal(checked.outcome.admitted, true);
    assert.throws(() => removeGuest(invited.file, edited, checked.checkIns, admin, listId, guestId), /checked in/);
    const renamed = updateGuest(invited.file, edited, admin, listId, guestId, { name: 'Mina Costa', email: 'mina@example.com', observation: 'Still coming' });
    assert.equal(renamed.find((list) => list.id === listId)?.guests[0]?.name, 'Mina Costa');
  });

  it('lets an admin add a guest and lets door check that guest in once', () => {
    const invited = inviteDoor(accounts(), [], admin, 'doe@example.com', ['party-a'], parties, now);
    assert.throws(() => createGuestList(invited.file, [], door, 'party-a', 'Artists', parties, now), /not allowed/);
    const lists = createGuestList(invited.file, [], admin, 'party-a', 'Artists', parties, now);
    const withGuest = addGuest(invited.file, lists, admin, lists[0]?.id ?? '', 'Mina Souza', now);
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
    const offers = await api.request('/guest-list-offers');
    assert.equal(offers.status, 200);
    assert.equal(JSON.stringify(await offers.json()).includes('guests'), false);
    const source = readFileSync(new URL('../src/check-in.ts', import.meta.url), 'utf8');
    assert.equal(source.includes('markPaymentConfirmed'), false);
    assert.equal(source.includes('recordRefund'), false);
    const committed = readFileSync(new URL('../../../data/operational/guest-lists.json', import.meta.url), 'utf8');
    assert.equal(JSON.parse(committed).records.length, 0);
    assert.equal(root.includes(`${join('public', 'data')}`), false);
  });
});
