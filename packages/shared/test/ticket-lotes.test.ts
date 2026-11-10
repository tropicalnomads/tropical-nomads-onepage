import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loteStatuses, openLoteOffers } from '../src/events/ticket-lotes.ts';
import { parseArtist } from '../src/schema/catalog.ts';
import { soundCloudPlayerUrl } from '../src/events/artist-profile.ts';

const now = new Date('2026-06-15T12:00:00.000Z');

describe('ticket lotes', () => {
  it('closes a lote on quantity and opens the next one', () => {
    const offers = [
      { name: 'Promo', amount: 20, currency: 'EUR' as const, capacity: 20, ticket: 'General', endsAt: '2026-12-13T23:59:00.000Z' },
      { name: 'Release', amount: 25, currency: 'EUR' as const, capacity: 50, ticket: 'General', endsAt: '2026-12-25T23:59:00.000Z' },
    ];
    assert.deepEqual(loteStatuses(offers, { Promo: 20 }, now), ['sold-out', 'on-sale']);
    assert.deepEqual(
      openLoteOffers(offers, { Promo: 20 }, now).map((offer) => offer.name),
      ['Release'],
    );
  });

  it('closes a lote on its end date while quantity remains', () => {
    const offers = [
      { name: 'Promo', amount: 20, currency: 'EUR' as const, capacity: 20, ticket: 'General', endsAt: '2026-06-01T00:00:00.000Z' },
      { name: 'Release', amount: 25, currency: 'EUR' as const, capacity: 50, ticket: 'General', endsAt: '2026-12-25T23:59:00.000Z' },
    ];
    assert.deepEqual(loteStatuses(offers, { Promo: 3 }, now), ['ended', 'on-sale']);
  });

  it('keeps an offer with no end date on sale until it sells out', () => {
    const offers = [{ name: 'Early', amount: 15, currency: 'EUR' as const, capacity: 40 }];
    assert.deepEqual(loteStatuses(offers, {}, now), ['on-sale']);
    assert.deepEqual(loteStatuses(offers, { Early: 39 }, now), ['on-sale']);
    assert.deepEqual(loteStatuses(offers, { Early: 40 }, now), ['sold-out']);
    assert.equal(openLoteOffers(offers, { Early: 39 }, now)[0]?.name, 'Early');
    assert.equal(openLoteOffers(offers, { Early: 40 }, now).length, 0);
  });
});

describe('artist profile', () => {
  it('accepts a SoundCloud link and stays valid when the new fields are empty', () => {
    const parsed = parseArtist({ id: 'mina', name: 'Mina', soundcloud: 'https://soundcloud.com/mina' });
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal(parsed.value.soundcloud, 'https://soundcloud.com/mina');
      assert.equal(soundCloudPlayerUrl(parsed.value.soundcloud ?? '')?.includes('soundcloud.com'), true);
    }
    const bare = parseArtist({ id: 'mina', name: 'Mina' });
    assert.equal(bare.ok, true);
    assert.equal(parseArtist({ id: 'mina', name: 'Mina', soundcloud: 'https://example.com/mina' }).ok, false);
  });
});
