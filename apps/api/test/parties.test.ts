import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import type { VerifiedSignIn } from 'tropical-nomads-shared';
import { euroTicketOffers, readTicketOffers } from 'tropical-nomads-shared';
import { offersForCatalogSeed } from '../../../database/party-seed.mjs';
import { emptyAccounts, registerVerifiedAccount, type AccountFile } from '../src/accounts.ts';
import { commitPartySave, publishedEventList, readManagedPartyFile, saveManagedParty, type PartySaveInput } from '../src/parties.ts';

const now = '2026-11-08T18:00:00.000Z';
const later = '2026-11-08T19:00:00.000Z';

function signIn(username: string): VerifiedSignIn {
  return {
    sub: `sub-${username}`,
    provider: 'cognito',
    providerSubject: `sub-${username}`,
    email: `${username}@example.com`,
    emailVerified: true,
    username,
    givenName: username,
    familyName: 'Nomad',
  };
}

function accounts(): AccountFile {
  const admin = registerVerifiedAccount(emptyAccounts(), signIn('admin'), [], now, { INITIAL_ADMIN_SUB: 'sub-admin' });
  const withBee = registerVerifiedAccount(admin, signIn('bee'), [], now);
  const withDoe = registerVerifiedAccount(withBee, signIn('ada'), [], now);
  return {
    ...withDoe,
    profiles: withDoe.profiles.map((profile) => (profile.sub === 'sub-bee' ? { ...profile, role: 'admin' as const } : profile)),
  };
}

function input(overrides: Partial<PartySaveInput> = {}): PartySaveInput {
  return {
    title: 'River Night',
    dateStart: '2026-12-01T22:00:00Z',
    dateEnd: '2026-12-02T06:00:00Z',
    timezone: 'Europe/Lisbon',
    venueName: 'Dock',
    venueCity: 'Lisbon',
    description: 'A night by the river.',
    imageUrl: 'https://cdn.example.com/flyer.jpg',
    artists: 'Mina, Leo',
    offers: [{ name: 'Early', amount: '15', capacity: '40' }],
    publish: false,
    ...overrides,
  };
}

describe('admin parties', () => {
  it('denies door and user, hides a draft, publishes a euro offer, and keeps both actors', async () => {
    const file = accounts();
    const door = { ...file, profiles: file.profiles.map((profile) => (profile.sub === 'sub-ada' ? { ...profile, role: 'door' as const } : profile)) };
    assert.throws(() => saveManagedParty([], [], input(), door, { role: 'door', actorId: 'sub-ada' }, now), /not allowed/);
    assert.throws(() => saveManagedParty([], [], input(), file, { role: 'user', actorId: 'sub-ada' }, now), /not allowed/);

    const catalog = [{ id: 'imported', title: 'Imported', dateStart: '2026-12-03T20:00:00Z', links: { tickets: 'https://www.example.com/tickets' } }];
    const edited = saveManagedParty([], catalog, input({ id: 'imported', title: 'Imported Night' }), file, { role: 'admin', actorId: 'sub-admin' }, now);
    assert.equal(edited.saved.origin, 'catalog');
    assert.equal(edited.saved.offersManaged, true);
    const imported = publishedEventList(catalog, edited.managed).find((event) => event.id === 'imported');
    assert.equal(imported?.title, 'Imported Night');
    assert.equal(imported?.links?.tickets, 'https://www.example.com/tickets');

    const created = saveManagedParty(edited.managed, catalog, input(), file, { role: 'admin', actorId: 'sub-admin' }, now);
    assert.equal(created.saved.publication, 'draft');
    assert.equal(created.saved.origin, 'admin');
    assert.deepEqual(publishedEventList([{ id: 'imported', title: 'Imported', dateStart: '2026-12-03T20:00:00Z' }], created.managed).map((event) => event.id), ['imported']);

    const published = saveManagedParty(created.managed, [], { ...input(), id: created.saved.id, publish: true }, file, { role: 'admin', actorId: 'sub-bee' }, later);
    assert.equal(published.saved.publication, 'published');
    assert.deepEqual(
      published.saved.revisions.map((revision) => revision.actorId),
      ['sub-admin', 'sub-bee'],
    );
    const visible = publishedEventList([], published.managed);
    assert.equal(visible.length, 1);
    assert.deepEqual(euroTicketOffers(readTicketOffers(visible[0]?.offers)), [{ name: 'Early', amount: 15, currency: 'EUR', capacity: 40 }]);
    assert.equal(offersForCatalogSeed(true, [{ name: 'Early', amount: 15, currency: 'EUR', capacity: 40 }], undefined) !== null, true);
    assert.equal(offersForCatalogSeed(false, [{ name: 'Kept' }], undefined), null);

    const root = mkdtempSync(join(tmpdir(), 'tn-parties-'));
    const stored = await commitPartySave(input({ publish: true }), file, { role: 'admin', actorId: 'sub-admin' }, now, root);
    assert.equal(readManagedPartyFile(root).some((party) => party.id === stored.id && party.publication === 'published'), true);
    assert.equal(publishedEventList([], readManagedPartyFile(root)).some((event) => event.id === stored.id), true);
  });
});
