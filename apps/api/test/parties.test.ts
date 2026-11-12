import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { euroTicketOffers, readTicketOffers, type Venue, type VerifiedSignIn } from 'tropical-nomads-shared';
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
    venueId: 'cargo-111-lisbon',
    description: 'A night by the river.',
    imageUrl: 'https://cdn.example.com/flyer.jpg',
    artists: 'Mina, Leo',
    offers: [{ name: 'Early', amount: '15', capacity: '40' }],
    publish: false,
    ...overrides,
  };
}

const venues: Venue[] = [
  {
    id: 'cargo-111-lisbon',
    name: 'Cargo 111',
    city: 'Lisbon',
    country: 'Portugal',
    address: 'Rua do Norte 111',
    mapUrl: 'https://maps.app.goo.gl/KoCdexDUkmuoHbep7',
  },
];

describe('admin parties', () => {
  it('denies door and user, hides a draft, publishes a euro offer, and keeps both actors', async () => {
    const file = accounts();
    const door = { ...file, profiles: file.profiles.map((profile) => (profile.sub === 'sub-ada' ? { ...profile, role: 'door' as const } : profile)) };
    assert.throws(() => saveManagedParty([], [], input(), door, { role: 'door', actorId: 'sub-ada' }, now, venues), /not allowed/);
    assert.throws(() => saveManagedParty([], [], input(), file, { role: 'user', actorId: 'sub-ada' }, now, venues), /not allowed/);

    const catalog = [{ id: 'imported', title: 'Imported', dateStart: '2026-12-03T20:00:00Z', headliners: ['Burn in Noise'], links: { tickets: 'https://www.example.com/tickets' } }];
    const edited = saveManagedParty([], catalog, input({ id: 'imported', title: 'Imported Night' }), file, { role: 'admin', actorId: 'sub-admin' }, now, venues);
    assert.equal(edited.saved.origin, 'catalog');
    assert.equal(edited.saved.offersManaged, true);
    const imported = publishedEventList(catalog, edited.managed).find((event) => event.id === 'imported');
    assert.equal(imported?.title, 'Imported Night');
    assert.equal(imported?.links?.tickets, 'https://www.example.com/tickets');
    assert.deepEqual(imported?.headliners, ['Burn in Noise']);

    const created = saveManagedParty(edited.managed, catalog, input(), file, { role: 'admin', actorId: 'sub-admin' }, now, venues);
    assert.equal(created.saved.publication, 'draft');
    assert.equal(created.saved.origin, 'admin');
    assert.deepEqual(publishedEventList([{ id: 'imported', title: 'Imported', dateStart: '2026-12-03T20:00:00Z' }], created.managed).map((event) => event.id), ['imported']);

    const published = saveManagedParty(created.managed, [], { ...input(), id: created.saved.id, publish: true }, file, { role: 'admin', actorId: 'sub-bee' }, later, venues);
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
    const storedVenue = stored.event.venue;
    assert.equal(typeof storedVenue === 'object' && storedVenue !== null && 'city' in storedVenue && storedVenue.city, 'Lisbon');
    assert.equal(typeof storedVenue === 'object' && storedVenue !== null && 'mapUrl' in storedVenue && storedVenue.mapUrl, 'https://maps.app.goo.gl/KoCdexDUkmuoHbep7');
  });

  it('stores lineup headliners and leaves them when the field is omitted', () => {
    const file = accounts();
    const caller = { role: 'admin' as const, actorId: 'sub-admin' };
    const saved = saveManagedParty([], [], input({ artists: 'Mina\nLeo', headliners: 'Leo\nMina\nLeo\nUnknown' }), file, caller, now, venues);
    assert.deepEqual(saved.saved.event.headliners, ['Leo', 'Mina']);
    const kept = saveManagedParty(saved.managed, [], input({ id: saved.saved.id, artists: 'Mina\nLeo' }), file, caller, now, venues);
    assert.deepEqual(kept.saved.event.headliners, ['Leo', 'Mina']);
    const cleared = saveManagedParty(kept.managed, [], input({ id: saved.saved.id, artists: 'Mina\nLeo', headliners: '' }), file, caller, now, venues);
    assert.deepEqual(cleared.saved.event.headliners, []);
  });

  it('rejects a city name as a timezone and copies the saved venue', () => {
    const file = accounts();
    const caller = { role: 'admin' as const, actorId: 'sub-admin' };
    const dock: Venue = {
      id: 'dock-lisbon',
      name: 'Dock',
      city: 'Lisbon',
      country: 'Portugal',
      address: 'Rua 1',
      mapUrl: 'https://maps.example/dock',
    };
    assert.throws(() => saveManagedParty([], [], input({ timezone: 'Dublin', venueId: dock.id }), file, caller, now, [dock]), /not saved/);
    assert.throws(() => saveManagedParty([], [], input({ venueId: 'missing-venue' }), file, caller, now, [dock]), /not saved/);
    const saved = saveManagedParty([], [], input({ timezone: 'Europe/Dublin', venueId: dock.id }), file, caller, now, [dock]);
    assert.equal(saved.saved.event.timezone, 'Europe/Dublin');
    const venue = saved.saved.event.venue;
    assert.equal(typeof venue === 'object' && venue !== null && 'name' in venue && venue.name, 'Dock');
    assert.equal(typeof venue === 'object' && venue !== null && 'city' in venue && venue.city, 'Lisbon');
    assert.equal(typeof venue === 'object' && venue !== null && 'address' in venue && venue.address, 'Rua 1');
    assert.equal(typeof venue === 'object' && venue !== null && 'mapUrl' in venue && venue.mapUrl, 'https://maps.example/dock');
  });
});
