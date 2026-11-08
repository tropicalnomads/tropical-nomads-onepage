import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { webAreas } from 'tropical-nomads-shared';
import { navigation } from '../src/navigation.ts';

describe('web shell navigation', () => {
  it('includes every area id from the shared package', () => {
    const ids = new Set(navigation.map((item) => item.id));
    assert.equal(ids.size, webAreas.length);
    for (const area of webAreas) {
      assert.equal(ids.has(area.id), true, area.id);
    }
  });
});
