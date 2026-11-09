import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { locales } from 'tropical-nomads-shared';
import { catalogAsset, shirtSrc } from '../src/events/assets.ts';
import { shopCopy } from '../src/i18n/shop-copy.ts';
import { addShopLine, parseShopCart, setShopLineQuantity } from '../src/shop/cart.ts';
import { shopOrderMessage, shopProducts, shopTotal, shopWhatsappUrl, shopAddressComplete } from '../src/shop/order.ts';

const address = {
  name: 'Ada Lovelace',
  line1: 'Rua Example 1',
  line2: 'Apartment 2',
  city: 'Lisbon',
  region: 'Lisbon',
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
    assert.equal(shopAddressComplete(address), true);
    assert.equal(shopAddressComplete({ ...address, city: '   ' }), false);
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

  it('keeps the address form on the checkout page', () => {
    const catalog = readFileSync(new URL('../src/components/ShopCatalog.tsx', import.meta.url), 'utf8');
    const product = readFileSync(new URL('../src/components/ShopProduct.tsx', import.meta.url), 'utf8');
    const added = readFileSync(new URL('../src/components/ShopAddedPanel.tsx', import.meta.url), 'utf8');
    const cart = readFileSync(new URL('../src/components/ShopCart.tsx', import.meta.url), 'utf8');
    const checkout = readFileSync(new URL('../src/components/ShopCheckout.tsx', import.meta.url), 'utf8');
    const review = readFileSync(new URL('../src/components/ShopReview.tsx', import.meta.url), 'utf8');
    const catalogPage = readFileSync(new URL('../app/shop/page.tsx', import.meta.url), 'utf8');
    const cartPage = readFileSync(new URL('../app/shop/cart/page.tsx', import.meta.url), 'utf8');
    const checkoutPage = readFileSync(new URL('../app/shop/checkout/page.tsx', import.meta.url), 'utf8');
    const postalLookup = readFileSync(new URL('../app/shop/postal-lookup/route.ts', import.meta.url), 'utf8');
    const deliveryActions = readFileSync(new URL('../src/shop/actions.ts', import.meta.url), 'utf8');
    const reviewPage = readFileSync(new URL('../app/shop/checkout/review/page.tsx', import.meta.url), 'utf8');
    const header = readFileSync(new URL('../src/components/ShellHeader.tsx', import.meta.url), 'utf8');
    assert.equal(catalog.includes('postalCode'), false);
    assert.equal(catalog.includes('<select'), false);
    assert.equal(catalogPage.includes('postalCode'), false);
    assert.equal(product.includes('<select'), false);
    assert.equal(product.includes('liveSizes'), true);
    assert.equal(product.includes('location.assign'), false);
    assert.equal(product.includes('ShopAddedPanel'), true);
    assert.equal(added.includes('/shop/cart'), true);
    assert.equal(added.includes('continue'), true);
    assert.equal(cart.includes('postalCode'), false);
    assert.equal(cart.includes('shopWhatsappUrl'), false);
    assert.equal(cart.includes('/shop/checkout'), true);
    assert.equal(cartPage.includes('ShopCart'), true);
    assert.equal(checkout.includes('postalCode'), true);
    assert.equal(checkout.includes('<select'), false);
    assert.equal(checkout.includes('SelectField'), true);
    assert.equal(checkout.includes('savedAddress'), true);
    assert.equal(checkout.includes('lookupPostalCode'), true);
    assert.equal(checkoutPage.includes('ShopCheckout'), true);
    assert.equal(checkoutPage.includes('billingAddresses'), true);
    assert.equal(postalLookup.includes('nominatim.openstreetmap.org'), true);
    assert.equal(deliveryActions.includes('saveDefaultBillingAddress'), true);
    assert.equal(review.includes('shopWhatsappUrl'), true);
    assert.equal(reviewPage.includes('ShopReview'), true);
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