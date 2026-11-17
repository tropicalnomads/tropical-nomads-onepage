import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assignEventSlugs, eventSlug, eventSlugFor } from '../src/events/slug.ts';

describe('event slug', () => {
  it('turns a title into a short lowercase link', () => {
    assert.equal(eventSlug('Tropical Groove Presents: Kobot, Deutsch and Middle-D'), 'tropical-groove-presents-kobot-deutsch-and-middle-d');
    assert.equal(eventSlug('São Paulo Night'), 'sao-paulo-night');
    assert.equal(eventSlug('   '), 'event');
  });

  it('keeps a saved slug and gives the next same title a number', () => {
    const assigned = assignEventSlugs([
      { id: 'party-bbb', title: 'River Night', slug: 'river-night' },
      { id: 'party-aaa', title: 'River Night' },
    ]);
    assert.equal(assigned.get('party-bbb'), 'river-night');
    assert.equal(assigned.get('party-aaa'), 'river-night-2');
    assert.equal(eventSlugFor('River Night', 'party-ccc', [{ id: 'party-bbb', title: 'River Night', slug: 'river-night' }]), 'river-night-2');
  });

  it('never gives two events the same slug', () => {
    const assigned = assignEventSlugs([
      { id: 'a', title: 'River Night', slug: 'river-night' },
      { id: 'b', title: 'River Night', slug: 'river-night' },
      { id: 'c', title: 'River Night' },
      { id: 'd', title: 'São Paulo Night' },
    ]);
    const values = [...assigned.values()];
    assert.equal(assigned.size, 4);
    assert.equal(new Set(values).size, values.length);
    assert.equal(eventSlugFor('River Night', 'e', [{ id: 'a', title: 'River Night' }, { id: 'c', title: 'Forest' }]), 'river-night-2');
  });

  it('does not use another event id as a slug', () => {
    const assigned = assignEventSlugs([
      { id: 'grove', title: 'Grove' },
      { id: 'party-1', title: 'Something', slug: 'grove' },
    ]);
    assert.equal(assigned.get('grove'), 'grove');
    assert.notEqual(assigned.get('party-1'), 'grove');
  });
});
