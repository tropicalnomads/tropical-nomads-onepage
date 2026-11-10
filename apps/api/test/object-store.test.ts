import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { shopImageType, shopObjectKey } from '../src/object-store.ts';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

function webp(): Uint8Array {
  const bytes = new Uint8Array(12);
  bytes.set([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
  return bytes;
}

describe('shop object store', () => {
  it('uses one shop key for a safe product id', () => {
    assert.equal(shopObjectKey('hw'), 'shop/hw');
    assert.equal(shopObjectKey('psy-groove'), 'shop/psy-groove');
    assert.equal(shopObjectKey('../secret'), undefined);
    assert.equal(shopObjectKey('shop/hw'), undefined);
    assert.equal(shopObjectKey('a'.repeat(41)), undefined);
    assert.equal(shopObjectKey(''), undefined);
  });

  it('accepts jpeg, png, and webp up to 5 MB', () => {
    assert.equal(shopImageType(new Uint8Array(png)), 'image/png');
    assert.equal(shopImageType(new Uint8Array([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0])), 'image/jpeg');
    assert.equal(shopImageType(webp()), 'image/webp');
    assert.equal(shopImageType(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])), undefined);
    const tooBig = new Uint8Array(5_000_001);
    tooBig.set([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]);
    assert.equal(shopImageType(tooBig), undefined);
    const atLimit = new Uint8Array(5_000_000);
    atLimit.set(png);
    assert.equal(shopImageType(atLimit), 'image/png');
  });
});
