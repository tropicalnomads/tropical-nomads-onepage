import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { emptyShopProduct, shopProductValues, shopSizeCodes } from '../src/admin/shop-values.ts';
import { shopProductSubmission } from '../src/admin/shop-submission.ts';
import type { ShopCatalogProduct } from '../src/shop/catalog.ts';
import { parseAdminProductCatalog } from '../src/shop/load-products.ts';

const product: ShopCatalogProduct = {
  id: 'hw',
  name: 'Halloween',
  description: { en: 'English\nline 🌴', pt: 'Português' },
  image: '/shop/media/hw',
  imageAlt: 'Halloween',
  amount: 50,
  currency: 'EUR',
  stock: [{ code: 'M', count: 2 }],
};

function form(description = 'Hello\n🌴'): FormData {
  const data = new FormData();
  data.set('name', 'Shirt');
  data.set('description', description);
  data.set('amount', '50');
  for (const size of shopSizeCodes) {
    data.set(`stock-${size}`, '0');
  }
  return data;
}

describe('shop product form', () => {
  it('opens an existing shirt from the English description', () => {
    const values = shopProductValues(product, '/shop/media/hw');
    assert.equal(values.description, 'English\nline 🌴');
    assert.equal(values.image, '/shop/media/hw');
    assert.equal(values.stock.M, 2);
    assert.equal(emptyShopProduct.description, '');
    assert.equal(emptyShopProduct.hidden, false);
    assert.equal(values.hidden, false);
    assert.equal(shopProductValues({ ...product, hidden: true }).hidden, true);
    assert.equal('descriptionEn' in values, false);
    assert.equal('descriptionPt' in emptyShopProduct, false);
  });

  it('reads one description and treats a missing image as keep or remove', async () => {
    const keptByDefault = await shopProductSubmission(form());
    assert.equal(keptByDefault?.imageAction, 'keep');
    assert.equal(keptByDefault?.description, 'Hello\n🌴');
    assert.equal(keptByDefault?.imageBase64, undefined);
    const data = form();
    data.set('imageAction', 'remove');
    data.set('id', 'hw');
    const parsed = await shopProductSubmission(data);
    assert.equal(parsed?.id, 'hw');
    assert.equal(parsed?.description, 'Hello\n🌴');
    assert.equal(parsed?.imageAction, 'remove');
    assert.equal(parsed?.imageBase64, undefined);
    const kept = form();
    kept.set('imageAction', 'keep');
    assert.equal((await shopProductSubmission(kept))?.imageAction, 'keep');
    const both = form();
    both.append('imageAction', 'keep');
    both.append('imageAction', 'remove');
    assert.equal((await shopProductSubmission(both))?.imageAction, 'remove');
    const invalid = form();
    invalid.set('imageAction', 'drop');
    assert.equal(await shopProductSubmission(invalid), undefined);
    const stock = form();
    stock.set('stock-P', 'no');
    assert.equal(await shopProductSubmission(stock), undefined);
    assert.equal((await shopProductSubmission(form()))?.hidden, undefined);
    const shown = form();
    shown.set('hidden', 'false');
    assert.equal((await shopProductSubmission(shown))?.hidden, false);
    const concealed = form();
    concealed.set('hidden', 'true');
    assert.equal((await shopProductSubmission(concealed))?.hidden, true);
    const badHidden = form();
    badHidden.set('hidden', 'yes');
    assert.equal(await shopProductSubmission(badHidden), undefined);
    const admin = parseAdminProductCatalog([
      {
        id: 'secret',
        name: 'Secret',
        description: { en: 'Hidden shirt', pt: 'Hidden shirt' },
        image: '',
        imageAlt: 'Secret',
        amount: 40,
        currency: 'EUR',
        stock: [{ code: 'M', count: 1 }],
        hidden: true,
      },
    ]);
    assert.equal(admin[0]?.hidden, true);
    assert.equal(parseAdminProductCatalog([{ ...admin[0], hidden: false, stock: [{ code: 'M', count: 1 }] }])[0]?.hidden, false);
  });

  it('sends a chosen file and rejects a file over 5 MB', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const data = form();
    data.set('image', new File([bytes], 'shirt.webp', { type: 'image/webp' }));
    data.set('imageAction', 'remove');
    const parsed = await shopProductSubmission(data);
    assert.equal(parsed?.imageBase64, Buffer.from(bytes).toString('base64'));
    assert.equal(parsed?.imageAction, 'remove');
    const huge = form();
    huge.set('image', new File([new Uint8Array(5_000_001)], 'big.png', { type: 'image/png' }));
    assert.equal(await shopProductSubmission(huge), undefined);
  });

  it('submits one description field and an image removal flag', () => {
    const source = readFileSync(new URL('../src/components/AdminShopForm.tsx', import.meta.url), 'utf8');
    const catalog = readFileSync(new URL('../src/components/ShopCatalog.tsx', import.meta.url), 'utf8');
    const page = readFileSync(new URL('../src/components/ShopProduct.tsx', import.meta.url), 'utf8');
    const editPage = readFileSync(new URL('../app/admin/shop/[productId]/page.tsx', import.meta.url), 'utf8');
    const actions = readFileSync(new URL('../src/admin/shop-actions.ts', import.meta.url), 'utf8');
    assert.equal(source.includes('name="description"'), true);
    assert.equal(source.includes('name="hidden"'), true);
    assert.equal(source.includes('descriptionEn'), false);
    assert.equal(source.includes('descriptionPt'), false);
    assert.equal(source.includes("formData.set('imageAction', imageRemoved ? 'remove' : 'keep')"), true);
    assert.equal(source.includes('type="file"'), true);
    assert.equal(source.includes('className="sr-only"'), true);
    assert.equal(catalog.includes('ShopMarkdown'), true);
    assert.equal(page.includes('ShopMarkdown'), true);
    assert.equal(editPage.includes('loadAdminShopProduct'), true);
    assert.equal(editPage.includes('loadShopProducts'), false);
    assert.equal(actions.includes('loadAdminShopProducts'), true);
    assert.equal(actions.includes('deleteShopProductAction'), true);
    assert.equal(actions.includes("'delete-shop-product'"), true);
  });
});
