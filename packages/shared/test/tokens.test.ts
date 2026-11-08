import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { hasToken, textContract, textView } from '../src/index.ts';

describe('text component contract', () => {
  it('uses token names that exist in the token set', () => {
    for (const name of textContract.tokens) {
      assert.equal(hasToken(name), true, name);
    }
  });

  it('renders text with the navy and base type tokens', () => {
    const view = textView('Tropical Nomads');
    assert.equal(view.type, 'Text');
    assert.equal(view.children, 'Tropical Nomads');
    assert.equal(view.color, '#042f2e');
    assert.equal(view.fontSize, '1rem');
    assert.equal(view.lineHeight, '1.5rem');
    assert.match(view.fontFamily, /Outfit Variable/);
  });
});
