import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { webAreas } from 'tropical-nomads-shared';
import { navigation } from '../src/navigation.ts';

describe('web shell navigation', () => {
  it('keeps public areas in the bar and leaves tickets and check-in off it', () => {
    assert.deepEqual(
      navigation.map((item) => item.id),
      ['upcoming-events', 'shop'],
    );
    assert.deepEqual(
      navigation.map((item) => item.href),
      ['/upcoming-events', '/shop'],
    );
    const areaIds = new Set(webAreas.map((area) => area.id));
    assert.equal(areaIds.has('my-tickets'), true);
    assert.equal(areaIds.has('my-orders'), true);
    assert.equal(areaIds.has('check-in'), true);
  });
});
