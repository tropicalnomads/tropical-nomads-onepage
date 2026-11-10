import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { locales } from 'tropical-nomads-shared';
import { SHOP_PRODUCTS, SHOP_PRICE_EUR } from '../../one-pager/src/lib/shop.ts';
import { catalogAsset, shirtSrc } from '../src/events/assets.ts';
import { shopCopy } from '../src/i18n/shop-copy.ts';
import { addShopLine, parseShopCart, setShopLineQuantity } from '../src/shop/cart.ts';
import { catalogSizes } from '../src/shop/catalog.ts';
import { productImageSrc } from '../src/shop/load-images.ts';
import { parseShopCatalog } from '../src/shop/load-products.ts';
import { readShopConfirmation, shopConfirmationRecord, shopOrderMessage, shopTotal, shopWhatsappUrl, shopAddressComplete } from '../src/shop/order.ts';
import { canonicalCountryName, countryChoices, postalLookupKey } from '../src/shop/postal.ts';

const address = {
  name: 'Ada Lovelace',
  line1: 'Rua Example 1',
  line2: 'Apartment 2',
  city: 'Lisbon',
  region: 'Lisbon',
  postalCode: '1000-001',
  country: 'Portugal',
};

const catalog = SHOP_PRODUCTS.map((product) => ({
  id: product.id,
  name: product.name,
  description: product.description,
  image: product.image,
  imageAlt: product.imageAlt,
  amount: SHOP_PRICE_EUR,
  currency: 'EUR',
  stock: product.stock,
}));

describe('shop', () => {
  it('reads shirts from stored product records', () => {
    const products = parseShopCatalog({ products: catalog });
    assert.deepEqual(
      products.map((product) => product.id),
      ['hw', 'pg'],
    );
    assert.equal(products[0]?.name, 'Tropical Nomads Halloween Special');
    assert.equal(products[1]?.name, 'Psy Groove');
    assert.match(products[0]?.description.en ?? '', /Tropical Nomads/);
    assert.match(products[1]?.description.pt ?? '', /Psy Groove/);
    assert.equal(products[0]?.amount, 50);
    const extra = parseShopCatalog({
      products: [
        {
          id: 'night',
          name: 'Night Shift',
          description: { en: 'UV embroidery for late sets.', pt: 'Bordado UV para sets tarde.' },
          image: '/shop/NIGHT.webp',
          imageAlt: 'Night Shift T-shirt',
          amount: 40,
          currency: 'EUR',
          stock: [{ code: 'M', count: 1 }],
        },
      ],
    });
    assert.equal(extra[0]?.id, 'night');
    assert.throws(() => parseShopCatalog({ products: [{ id: 'hw' }] }), /products are unavailable/);
    assert.equal(shirtSrc('/shop/HW_TEE_UV.webp'), '/catalog-assets/shop/HW_TEE_UV.webp');
    assert.equal(shirtSrc('/shop/PG_TEE_UV.webp'), '/catalog-assets/shop/PG_TEE_UV.webp');
    assert.equal(catalogAsset('shop', '../events.json'), undefined);
    const webOrder = readFileSync(new URL('../src/shop/order.ts', import.meta.url), 'utf8');
    const webLoad = readFileSync(new URL('../src/shop/load-products.ts', import.meta.url), 'utf8');
    const apiProducts = readFileSync(new URL('../../api/src/products.ts', import.meta.url), 'utf8');
    assert.equal(webOrder.includes('SHOP_PRODUCTS'), false);
    assert.equal(webLoad.includes('SHOP_PRODUCTS'), false);
    assert.equal(apiProducts.includes('SHOP_PRODUCTS'), false);
  });

  it('builds a WhatsApp order with sizes, address, and the total last', () => {
    const lines = [
      { productId: 'hw' as const, size: 'G' as const, quantity: 2 },
      { productId: 'pg' as const, size: 'M' as const, quantity: 1 },
    ];
    const message = shopOrderMessage(lines, address, 'en', catalog);
    assert.ok(message);
    assert.match(message, /Tropical Nomads Halloween Special/);
    assert.match(message, /2 × L · €100/);
    assert.match(message, /Psy Groove/);
    assert.match(message, /1 × M · €50/);
    assert.match(message, /Ada Lovelace/);
    assert.match(message, /1000-001/);
    assert.equal(message.endsWith('Total €150'), true);
    const saved = shopOrderMessage(lines, address, 'en', catalog, 'order-abcdef0123456789');
    assert.match(saved ?? '', /Order order-abcdef0123456789/);
    assert.equal(saved?.endsWith('Total €150'), true);
    assert.equal(shopTotal(lines, catalog), 150);
    const url = new URL(shopWhatsappUrl(message));
    assert.equal(url.origin, 'https://wa.me');
    assert.equal(url.pathname, '/4917648996011');
    assert.equal(url.searchParams.get('text'), message);
    assert.equal(message.includes('351911891127'), false);
    assert.equal(shopOrderMessage(lines, { ...address, city: '   ' }, 'en', catalog), undefined);
    assert.equal(shopOrderMessage([], address, 'pt', catalog), undefined);
    assert.equal(shopOrderMessage([{ productId: 'hw', size: 'G', quantity: 99 }], address, 'en', catalog), undefined);
    assert.equal(shopAddressComplete(address), true);
    assert.equal(shopAddressComplete({ ...address, city: '   ' }), false);
  });

  it('merges the same shirt and size and keeps the quantity inside stock', () => {
    const once = addShopLine([], { productId: 'hw', size: 'G', quantity: 2 }, catalog);
    const twice = addShopLine(once, { productId: 'hw', size: 'G', quantity: 2 }, catalog);
    assert.deepEqual(twice, [{ productId: 'hw', size: 'G', quantity: 3 }]);
    assert.equal(setShopLineQuantity(twice, 'hw', 'G', 9, catalog)[0]?.quantity, 3);
    assert.deepEqual(setShopLineQuantity(twice, 'hw', 'G', 0, catalog), []);
    const stored = parseShopCart(
      JSON.stringify({
        lines: [
          { productId: 'hw', size: 'P', quantity: 2 },
          { productId: 'pg', size: 'M', quantity: 9 },
        ],
        address: { name: 'Ada', line1: '', city: '', postalCode: '', country: '' },
      }),
      catalog,
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
    assert.equal(product.includes('catalogSizes'), true);
    assert.equal(product.includes('soldOutLabel'), true);
    assert.equal(catalog.includes('soldOutLabel'), true);
    assert.equal(catalog.includes('/admin/shop/new'), false);
    assert.equal(catalog.includes('editProduct'), false);
    assert.equal(catalog.includes('/admin/shop/${'), false);
    assert.equal((catalog.match(/href="\/admin\/shop"/g) ?? []).length, 1);
    assert.equal(catalog.includes("shopText(language, 'admin')"), true);
    assert.equal(product.includes('location.assign'), false);
    assert.equal(product.includes('ShopAddedPanel'), true);
    assert.equal(added.includes('/shop/cart'), true);
    assert.equal(added.includes('continue'), true);
    assert.equal(cart.includes('postalCode'), false);
    assert.equal(cart.includes('shopWhatsappUrl'), false);
    assert.equal(cart.includes('/shop/checkout'), true);
    const cartCheckoutAt = cart.indexOf('href="/shop/checkout"');
    assert.equal(cart.indexOf("publicHref('/shop', language)", cartCheckoutAt) > cartCheckoutAt, true);
    const checkoutFormAt = checkout.indexOf('<form');
    assert.equal(checkout.indexOf("publicHref('/shop', language)", checkoutFormAt) > checkoutFormAt, true);
    const reviewNoteAt = review.lastIndexOf("shopText(language, 'note')");
    assert.equal(review.indexOf("publicHref('/shop', language)", reviewNoteAt) > reviewNoteAt, true);
    assert.equal(cartPage.includes('ShopCart'), true);
    assert.equal(checkout.includes('postalCode'), true);
    assert.equal(checkout.includes('<select'), false);
    assert.equal(checkout.includes('SelectField'), true);
    assert.equal(checkout.includes('savedAddress'), true);
    assert.equal(checkout.includes('lookupPostalCode'), true);
    assert.equal(checkout.includes('searchable'), true);
    assert.equal(checkout.includes('countryChoices'), true);
    assert.equal(checkout.includes('lookupHelp'), false);
    assert.equal(checkout.includes('Find address'), false);
    const nameAt = checkout.indexOf('name="name"');
    const postalAt = checkout.indexOf('name="postalCode"');
    const lineAt = checkout.indexOf('name="line1"');
    const countryAt = checkout.indexOf('name="country"');
    assert.equal(nameAt < postalAt && postalAt < lineAt && lineAt < countryAt, true);
    assert.equal(checkoutPage.includes('ShopCheckout'), true);
    assert.equal(checkoutPage.includes('billingAddresses'), true);
    assert.equal(postalLookup.includes('nominatim.openstreetmap.org'), true);
    assert.equal(deliveryActions.includes('saveDefaultBillingAddress'), true);
    const complete = readFileSync(new URL('../src/components/ShopOrderComplete.tsx', import.meta.url), 'utf8');
    const completePage = readFileSync(new URL('../app/shop/checkout/complete/page.tsx', import.meta.url), 'utf8');
    assert.equal(review.includes('shopWhatsappUrl'), false);
    assert.equal(review.includes('/shop/checkout/complete'), true);
    assert.equal(review.includes('placeShopOrderAction'), true);
    assert.equal(review.includes('sessionStorage'), true);
    assert.equal(complete.includes('shopWhatsappUrl'), true);
    assert.equal(complete.includes('searchParams'), false);
    assert.equal(completePage.includes('ShopOrderComplete'), true);
    assert.equal(reviewPage.includes('ShopReview'), true);
    assert.equal(catalogPage.includes('adminActor'), true);
    assert.equal(header.includes('/shop/cart'), true);
  });

  it('lists every country and still recognises saved country names', () => {
    const english = countryChoices('en');
    const portuguese = countryChoices('pt');
    assert.equal(english.length > 150, true);
    assert.equal(english.some((country) => country.value === 'Brazil'), true);
    assert.equal(english.some((country) => country.value === 'Japan'), true);
    assert.equal(english.some((country) => country.value === 'United States'), true);
    assert.equal(portuguese.some((country) => country.value === 'Brazil' && country.label === 'Brasil'), true);
    assert.equal(canonicalCountryName('br'), 'Brazil');
    assert.equal(canonicalCountryName('Brasil'), 'Brazil');
    assert.equal(canonicalCountryName('uk'), 'United Kingdom');
    assert.equal(canonicalCountryName('jp'), 'Japan');
    assert.equal(postalLookupKey('1000-001', 'Portugal'), postalLookupKey('1000001', 'pt'));
  });

  it('keeps every size on a sold-out shirt and only accepts a stored shop image path', () => {
    assert.deepEqual(
      catalogSizes([{ code: 'M', count: 2 }]).map((size) => [size.code, size.count]),
      [
        ['P', 0],
        ['M', 2],
        ['G', 0],
        ['GG', 0],
        ['2XL', 0],
      ],
    );
    assert.equal(productImageSrc('/shop/media/new-shirt'), '/shop/media/new-shirt');
    assert.equal(productImageSrc('/shop/media/../secret'), undefined);
    const record = shopConfirmationRecord('order-abcdef1234567890', 'Tropical Nomads shop');
    assert.equal(record?.orderId, 'order-abcdef1234567890');
    assert.equal(readShopConfirmation(JSON.stringify(record))?.message, 'Tropical Nomads shop');
    assert.equal(readShopConfirmation(JSON.stringify({ orderId: 'order-1', message: 'hidden address' })), undefined);
  });

  it('has the same shop labels in English and Portuguese', () => {
    assert.equal('metaHw' in shopCopy.en, false);
    assert.equal('metaPg' in shopCopy.en, false);
    assert.deepEqual(Object.keys(shopCopy.en).sort(), Object.keys(shopCopy.pt).sort());
    for (const language of locales) {
      for (const value of Object.values(shopCopy[language])) {
        assert.notEqual(value.trim(), '');
      }
    }
  });
});