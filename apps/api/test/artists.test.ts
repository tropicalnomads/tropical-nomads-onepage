import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readArtistSave, withProfile } from '../src/artists.ts';

describe('artist country', () => {
  it('keeps the country name and its code', () => {
    const saved = readArtistSave({ name: 'After June', country: 'Brazil', isoCountry: 'br', genres: ['Full-On'] });
    assert.equal(saved.country, 'Brazil');
    assert.equal(saved.isoCountry, 'BR');
  });

  it('leaves an omitted code unchanged and clears an empty code', () => {
    assert.equal(readArtistSave({ name: 'After June', country: 'Brazil', genres: [] }).isoCountry, undefined);
    assert.equal(readArtistSave({ name: 'After June', country: '', isoCountry: '', genres: [] }).isoCountry, '');
  });

  it('replaces a stored flag when the country changes', () => {
    const saved = readArtistSave({ name: 'After June', country: 'American Samoa', isoCountry: 'AS', genres: [] });
    const next = withProfile({ id: 'after-june', name: 'After June', country: 'BR', isoCountry: 'BR', countryFlag: '🇧🇷' }, saved);
    assert.equal(next.country, 'American Samoa');
    assert.equal(next.isoCountry, 'AS');
    assert.equal(next.countryFlag, 'AS');
    const cleared = withProfile(next, readArtistSave({ name: 'After June', country: '', isoCountry: '', genres: [] }));
    assert.equal('isoCountry' in cleared, false);
    assert.equal('countryFlag' in cleared, false);
    const kept = withProfile(
      { countryFlag: '🇧🇷', isoCountry: 'BR', country: 'Brazil' },
      readArtistSave({ name: 'After June', country: 'Brazil', genres: [] }),
    );
    assert.equal(kept.countryFlag, '🇧🇷');
    assert.equal(kept.isoCountry, 'BR');
  });
});
