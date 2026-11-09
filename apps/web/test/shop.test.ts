import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { locales } from 'tropical-nomads-shared';
import { catalogAsset, shirtSrc } from '../src/events/assets.ts';
import { shopCopy } from '../src/i18n/shop-copy.ts';
import { addShopLine, parseShopCart, setShopLineQuantity } from '../src/shop/cart.ts';
import { shopOrderMessage, shopProducts, shopTotal, shopWhatsappUrl } from '../src/shop/order.ts';

const address = {
  name: 'Ada Lovelace',
  line1: 'Rua Example 1',
  city: 'Lisbon',
  postalCode: '1000-001',
  country: 'Portugal',
};

describe('shop', () => {
  it('lists the two shirts from the public page', () => {
    const products = shopProducts();
    assert.deepEqual(
      products.map((product) => product.id),
      ['hw', 'pg'],
    );
    assert.equal(products[0]?.name, 'Tropical Groove Halloween');
    assert.equal(products[1]?.name, 'Psy Groove');
    assert.equal(shirtSrc('/shop/HW_TEE_UV.webp'), '/catalog-assets/shop/HW_TEE_UV.webp');
    assert.equal(shirtSrc('/shop/PG_TEE_UV.webp'), '/catalog-assets/shop/PG_TEE_UV.webp');
    assert.equal(catalogAsset('shop', '../events.json'), undefined);
  });

  it('builds a WhatsApp order with sizes, address, and the total last', () => {
    const lines = [
      { productId: 'hw' as const, size: 'G' as const, quantity: 2 },
      { productId: 'pg' as const, size: 'M' as const, quantity: 1 },
    ];
    const message = shopOrderMessage(lines, address, 'en');
    assert.ok(message);
    assert.match(message, /Tropical Groove Halloween/);
    assert.match(message, /2 × L · €100/);
    assert.match(message, /Psy Groove/);
    assert.match(message, /1 × M · €50/);
    assert.match(message, /Ada Lovelace/);
    assert.match(message, /1000-001/);
    assert.equal(message.endsWith('Total €150'), true);
    assert.equal(shopTotal(lines), 150);
    const url = new URL(shopWhatsappUrl(message));
    assert.equal(url.origin, 'https://wa.me');
    assert.equal(url.pathname, '/4917648996011');
    assert.equal(url.searchParams.get('text'), message);
    assert.equal(message.includes('351911891127'), false);
    assert.equal(shopOrderMessage(lines, { ...address, city: '   ' }, 'en'), undefined);
    assert.equal(shopOrderMessage([], address, 'pt'), undefined);
    assert.equal(shopOrderMessage([{ productId: 'hw', size: 'G', quantity: 99 }], address, 'en'), undefined);
  });

  it('merges the same shirt and size and keeps the quantity inside stock', () => {
    const once = addShopLine([], { productId: 'hw', size: 'G', quantity: 2 });
    const twice = addShopLine(once, { productId: 'hw', size: 'G', quantity: 2 });
    assert.deepEqual(twice, [{ productId: 'hw', size: 'G', quantity: 3 }]);
    assert.equal(setShopLineQuantity(twice, 'hw', 'G', 9)[0]?.quantity, 3);
    assert.deepEqual(setShopLineQuantity(twice, 'hw', 'G', 0), []);
    const stored = parseShopCart(
      JSON.stringify({
        lines: [
          { productId: 'hw', size: 'P', quantity: 2 },
          { productId: 'pg', size: 'M', quantity: 9 },
        ],
        address: { name: 'Ada', line1: '', city: '', postalCode: '', country: '' },
      }),
    );
    assert.deepEqual(stored.lines, [{ productId: 'pg', size: 'M', quantity: 2 }]);
    assert.equal(stored.address.name, 'Ada');
  });

  it('keeps the address form on the cart page', () => {
    const catalog = readFileSync(new URL('../src/components/ShopCatalog.tsx', import.meta.url), 'utf8');
    const product = readFileSync(new URL('../src/components/ShopProduct.tsx', import.meta.url), 'utf8');
    const cart = readFileSync(new URL('../src/components/ShopCart.tsx', import.meta.url), 'utf8');
    const catalogPage = readFileSync(new URL('../app/shop/page.tsx', import.meta.url), 'utf8');
    const cartPage = readFileSync(new URL('../app/shop/cart/page.tsx', import.meta.url), 'utf8');
    const header = readFileSync(new URL('../src/components/ShellHeader.tsx', import.meta.url), 'utf8');
    assert.equal(catalog.includes('postalCode'), false);
    assert.equal(catalog.includes('<select'), false);
    assert.equal(catalogPage.includes('postalCode'), false);
    assert.equal(product.includes('<select'), false);
    assert.equal(product.includes('liveSizes'), true);
    assert.equal(cart.includes('postalCode'), true);
    assert.equal(cart.includes('shopWhatsappUrl'), true);
    assert.equal(cartPage.includes('ShopCart'), true);
    assert.equal(header.includes('/shop/cart'), true);
  });

  it('has the same shop labels in English and Portuguese', () => {
    assert.deepEqual(Object.keys(shopCopy.en).sort(), Object.keys(shopCopy.pt).sort());
    for (const language of locales) {
      for (const value of Object.values(shopCopy[language])) {
        assert.notEqual(value.trim(), '');
      }
    }
  });
});