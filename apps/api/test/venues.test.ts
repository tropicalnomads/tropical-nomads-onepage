import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readVenueSave, venueIdFromPlace } from '../src/venues.ts';

describe('venues', () => {
  it('builds an id from the name and city and keeps a maps link', () => {
    assert.equal(venueIdFromPlace('The Sound House', 'Dublin'), 'the-sound-house-dublin');
    assert.equal(venueIdFromPlace('Alcateia Park', 'Florianópolis'), 'alcateia-park-florianopolis');
    const saved = readVenueSave({
      name: 'Dock',
      city: 'Lisbon',
      country: 'Portugal',
      isoCountry: 'pt',
      address: 'Rua 1',
      mapUrl: 'https://maps.example/dock',
    });
    assert.equal(saved.isoCountry, 'PT');
    assert.equal(saved.mapUrl, 'https://maps.example/dock');
    assert.throws(() => readVenueSave({ name: 'Dock', city: 'Lisbon', country: 'Portugal', mapUrl: 'http://maps.example/dock' }), /not saved/);
    assert.throws(() => readVenueSave({ name: 'Dock', city: '', country: 'Portugal' }), /not saved/);
  });
});
