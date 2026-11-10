import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import pg from 'pg';
import { databaseSettings, databaseTls } from '../src/database.ts';
import { assetsBucketName, deleteShopImage } from '../src/object-store.ts';
import { closeStoredDatabase } from '../src/sql-store.ts';
import { imageKind, productSlug, readProductImage, readShopProductDraft, requireShopAdmin, saveShopProduct } from '../src/shop-products.ts';

const envFile = resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env');
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

function draft(stockM = 2, image = new Uint8Array(png)) {
  return readShopProductDraft({
    name: 'Check Shirt',
    descriptionEn: 'A check shirt.',
    descriptionPt: 'Uma camisa de teste.',
    amount: '50.00',
    stock: { P: 0, M: stockM, G: 0, GG: 0, '2XL': 0 },
    imageBase64: Buffer.from(image).toString('base64'),
    role: 'admin',
  });
}

describe('shop products', () => {
  it('builds a short id and accepts only a real image', () => {
    assert.equal(productSlug('Psy Groove'), 'psy-groove');
    assert.equal(productSlug('Á'), 'shirt');
    assert.equal(imageKind(new Uint8Array(png)), 'image/png');
    assert.equal(imageKind(new Uint8Array([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0])), 'image/jpeg');
    assert.equal(imageKind(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])), undefined);
    const saved = draft();
    assert.equal(saved.amount, 50);
    assert.equal(saved.id, undefined);
    assert.equal(saved.stock.M, 2);
    assert.throws(() => readShopProductDraft({ ...draft(), amount: '0' }), /product was not saved/);
    assert.throws(() => readShopProductDraft({ name: 'Shirt', descriptionEn: 'English', descriptionPt: 'Português', amount: '50', stock: { P: 1 } }), /product was not saved/);
  });

  it('refuses a shop save when the caller has no session', async () => {
    await assert.rejects(() => requireShopAdmin(undefined), /request was not accepted/);
    await assert.rejects(() => requireShopAdmin('  '), /request was not accepted/);
  });

  const settings = databaseSettings();
  if (settings) {
    it('saves a product, keeps the image on edit, and writes a stock correction', async () => {
      const suffix = randomBytes(3).toString('hex');
      const title = `Check Shirt ${suffix}`;
      const client = new pg.Client({
        host: settings.host,
        port: settings.port,
        user: settings.user,
        password: settings.password,
        database: settings.database,
        ssl: databaseTls(),
      });
      await client.connect();
      let productId = '';
      try {
        const created = await saveShopProduct({ ...draft(), name: title }, 'admin-check');
        productId = created.id;
        assert.equal(productId.startsWith('check-shirt-'), true);
        const image = await readProductImage(productId);
        assert.equal(image?.contentType, 'image/png');
        assert.equal(image?.bytes.length, png.length);
        const row = await client.query<{ amount: string; image: string; document: { amount?: unknown; description?: { en?: string } } }>(
          'select amount, image, document from product where id = $1',
          [productId],
        );
        assert.equal(Number(row.rows[0]?.amount), 50);
        assert.equal(row.rows[0]?.image, `/shop/media/${productId}`);
        assert.equal(row.rows[0]?.document.amount, 50);
        assert.equal(row.rows[0]?.document.description?.en, 'A check shirt.');
        const counts = await client.query<{ size: string; count: number }>('select size, count from stock_count where product_id = $1 order by size', [productId]);
        assert.equal(counts.rows.length, 5);
        assert.equal(Number(counts.rows.find((item) => item.size === 'M')?.count), 2);

        const edited = readShopProductDraft({
          id: productId,
          name: title,
          descriptionEn: 'A check shirt.',
          descriptionPt: 'Uma camisa de teste.',
          amount: '55',
          stock: { P: 0, M: 4, G: 0, GG: 0, '2XL': 0 },
          role: 'user',
        });
        assert.equal(edited.image, undefined);
        const again = await saveShopProduct(edited, 'admin-check');
        assert.equal(again.id, productId);
        const price = await client.query<{ amount: string; image: string }>('select amount, image from product where id = $1', [productId]);
        assert.equal(Number(price.rows[0]?.amount), 55);
        assert.equal(price.rows[0]?.image, `/shop/media/${productId}`);
        const correction = await client.query<{ old_count: number; new_count: number }>(
          'select old_count, new_count from stock_correction where product_id = $1 and size = $2 order by at desc limit 1',
          [productId, 'M'],
        );
        assert.equal(Number(correction.rows[0]?.old_count), 2);
        assert.equal(Number(correction.rows[0]?.new_count), 4);
        const kept = await readProductImage(productId);
        assert.equal(kept?.contentType, 'image/png');
        assert.equal(Buffer.from(kept?.bytes ?? []).equals(png), true);
        if (assetsBucketName()) {
          const stored = await client.query('select product_id from product_image where product_id = $1', [productId]);
          assert.equal(stored.rowCount, 0);
          const replacement = new Uint8Array(png);
          replacement[20] = replacement[20] === 1 ? 2 : 1;
          await saveShopProduct({ ...edited, image: replacement }, 'admin-check');
          const replaced = await readProductImage(productId);
          assert.equal(replaced?.bytes[20], replacement[20]);
          const stillStored = await client.query('select product_id from product_image where product_id = $1', [productId]);
          assert.equal(stillStored.rowCount, 0);
        }
        await assert.rejects(() => saveShopProduct({ ...draft(1, new Uint8Array(png)), name: `Missing image ${suffix}`, image: undefined }, 'admin-check'), /product was not saved/);
      } finally {
        if (productId !== '' && assetsBucketName()) {
          await deleteShopImage(productId);
        }
        await client.query('delete from stock_correction where product_id in (select id from product where name = $1 or name = $2)', [title, `Missing image ${suffix}`]);
        await client.query('delete from product where name = $1 or name = $2', [title, `Missing image ${suffix}`]);
        await client.end();
        await closeStoredDatabase();
      }
    });
  }
});
