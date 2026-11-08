import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { acceptLocale, locales, selectLocale } from '../src/index.ts';

describe('languages', () => {
  it('accepts only en and pt', () => {
    assert.deepEqual(locales, ['en', 'pt']);
    assert.equal(acceptLocale('en').ok, true);
    assert.equal(acceptLocale('pt').ok, true);
    for (const code of ['fr', 'de', 'es', 'pt-BR', 'en-US', '']) {
      assert.equal(acceptLocale(code).ok, false, code);
    }
  });

  it('selects Portuguese from a stored pt value or a Portuguese device language', () => {
    assert.equal(selectLocale('pt', 'en'), 'pt');
    assert.equal(selectLocale(null, 'pt-BR'), 'pt');
    assert.equal(selectLocale(undefined, 'pt'), 'pt');
    assert.equal(selectLocale('', 'pt-PT'), 'pt');
  });

  it('selects English when the stored value and the device language are not recognized', () => {
    assert.equal(selectLocale(null, null), 'en');
    assert.equal(selectLocale(undefined, 'fr'), 'en');
    assert.equal(selectLocale('de', 'es'), 'en');
    assert.equal(selectLocale('zh-CN', ''), 'en');
  });
});
