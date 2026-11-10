import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import pg from 'pg';
import { api } from '../src/app.ts';
import { databaseSettings, databaseTls } from '../src/database.ts';
import { assetsBucketName, deleteShopImage, readShopImage } from '../src/object-store.ts';
import { handlePrivate } from '../src/private-api.ts';
import { loadProductCatalog, publicShopProducts } from '../src/products.ts';
import { closeStoredDatabase } from '../src/sql-store.ts';
import {
  deleteShopProduct,
  imageKind,
  listAdminShopProducts,
  productSlug,
  readAdminShopProduct,
  readProductImage,
  readShopProductDraft,
  requireShopAdmin,
  saveShopProduct,
} from '../src/shop-products.ts';

const envFile = resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env');
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const catalogIds = new Set(['hw', 'pg']);

function productInput(stockM = 2, image: Uint8Array | null = new Uint8Array(png)) {
  return {
    name: 'Check Shirt',
    description: 'A check shirt.',
    amount: '50.00',
    stock: { P: 0, M: stockM, G: 0, GG: 0, '2XL': 0 },
    ...(image ? { imageBase64: Buffer.from(image).toString('base64') } : { imageAction: 'keep' as const }),
  };
}

function draft(stockM = 2, image: Uint8Array | null = new Uint8Array(png)) {
  return readShopProductDraft(productInput(stockM, image));
}

function remember(ids: string[], id: string): void {
  if (catalogIds.has(id)) {
    throw new Error('refusing to change a catalog shirt');
  }
  ids.push(id);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function productIds(products: readonly unknown[]): string[] {
  return products.flatMap((item) => (isRecord(item) && typeof item.id === 'string' ? [item.id] : []));
}

function seal(payload: unknown): string | undefined {
  const secret = process.env.ACCOUNT_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    return undefined;
  }
  const body = Buffer.from(JSON.stringify({ v: payload, exp: Math.floor(Date.now() / 1000) + 60 }), 'utf8').toString('base64url');
  const mac = createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${mac}`;
}

function sessionCookie(sub: string): string | undefined {
  const secret = process.env.ACCOUNT_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    return undefined;
  }
  const body = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 60 }), 'utf8').toString('base64url');
  const mac = createHmac('sha256', secret).update(body).digest('base64url');
  return `tn:account:v1=${encodeURIComponent(`${body}.${mac}`)}`;
}

describe('shop products', () => {
  it('builds a short id and keeps one description with its line breaks', async () => {
    assert.equal(productSlug('Psy Groove'), 'psy-groove');
    assert.equal(productSlug('Á'), 'shirt');
    assert.equal(imageKind(new Uint8Array(png)), 'image/png');
    assert.equal(imageKind(new Uint8Array([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0])), 'image/jpeg');
    assert.equal(imageKind(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])), undefined);
    const saved = draft();
    assert.equal(saved.amount, 50);
    assert.equal(saved.id, undefined);
    assert.equal(saved.stock.M, 2);
    assert.equal(saved.description, 'A check shirt.');
    assert.equal(saved.imageChange.kind, 'replace');
    const marked = readShopProductDraft({ ...productInput(2, null), description: 'Line one\r\nline two 🌴', imageAction: 'remove' });
    assert.equal(marked.description, 'Line one\nline two 🌴');
    assert.deepEqual(marked.imageChange, { kind: 'remove' });
    const kept = readShopProductDraft(productInput(2, null));
    assert.deepEqual(kept.imageChange, { kind: 'keep' });
    const replaced = readShopProductDraft({ ...productInput(), imageAction: 'remove' });
    assert.equal(replaced.imageChange.kind, 'replace');
    const long = `${'a'.repeat(999)}🌴z`;
    const trimmed = readShopProductDraft({ ...productInput(2, null), description: long });
    assert.equal(trimmed.description, `${'a'.repeat(999)}🌴`);
    assert.equal([...trimmed.description].length, 1000);
    const spaced = readShopProductDraft({ ...productInput(2, null), description: 'A\u0000check  shirt\u0007.' });
    assert.equal(spaced.description, 'Acheck  shirt.');
    assert.throws(() => readShopProductDraft({ ...productInput(), amount: '0' }), /product was not saved/);
    assert.throws(() => readShopProductDraft({ name: 'Shirt', description: 'English', amount: '50', stock: { P: 1 } }), /product was not saved/);
    assert.throws(() => readShopProductDraft({ ...productInput(2, null), description: '4111111111111111' }), /product was not saved/);
    assert.throws(() => readShopProductDraft({ ...productInput(2, null), description: '4111 1111 1111 1111' }), /product was not saved/);
    assert.throws(() => readShopProductDraft({ ...productInput(2, null), description: '   \n  ' }), /product was not saved/);
    assert.throws(() => readShopProductDraft({ ...productInput(2, null), imageAction: 'drop' }), /product was not saved/);
    assert.equal(readShopProductDraft({ ...productInput(2, null), hidden: true }).hidden, true);
    assert.equal(readShopProductDraft({ ...productInput(2, null), hidden: false }).hidden, false);
    assert.equal(readShopProductDraft(productInput(2, null)).hidden, undefined);
    assert.throws(() => readShopProductDraft({ ...productInput(2, null), hidden: 'true' }), /product was not saved/);
    assert.deepEqual(productIds(publicShopProducts([{ id: 'shown' }, { id: 'secret', hidden: true }, { id: 'plain', hidden: false }])), ['shown', 'plain']);
    await assert.rejects(() => deleteShopProduct('not safe'), /product was not deleted/);
  });

  it('refuses a shop save when the caller has no session', async () => {
    await assert.rejects(() => requireShopAdmin(undefined), /request was not accepted/);
    await assert.rejects(() => requireShopAdmin('  '), /request was not accepted/);
    await assert.rejects(() => requireShopAdmin('not-an-admin'), /request was not accepted/);
    const cookie = sessionCookie('not-an-admin');
    const deniedId = 'missing-not-admin';
    for (const action of ['delete-shop-product', 'admin-shop-products', 'admin-shop-product'] as const) {
      const token = seal({ action, input: action === 'admin-shop-products' ? {} : { id: deniedId } });
      if (!token || !cookie) {
        continue;
      }
      const denied = await handlePrivate({ token }, cookie);
      assert.equal(denied.status, 400);
      assert.equal(denied.body.error, 'request was not accepted');
    }
  });

  const settings = databaseSettings();
  if (settings) {
    it('saves one description, keeps or removes the image, and allows a shirt with no photo', async () => {
      const suffix = randomBytes(3).toString('hex');
      const title = `Check Shirt ${suffix}`;
      const description = 'A check shirt.\nSecond line 🌴';
      const client = new pg.Client({
        host: settings.host,
        port: settings.port,
        user: settings.user,
        password: settings.password,
        database: settings.database,
        ssl: databaseTls(),
      });
      await client.connect();
      const createdIds: string[] = [];
      try {
        const created = await saveShopProduct(readShopProductDraft({ ...productInput(), name: title, description }), 'admin-check');
        remember(createdIds, created.id);
        const productId = created.id;
        assert.equal(productId.startsWith('check-shirt-'), true);
        const image = await readProductImage(productId);
        assert.equal(image?.contentType, 'image/png');
        assert.equal(image?.bytes.length, png.length);
        const row = await client.query<{ amount: string; image: string; document: { amount?: unknown; image?: unknown; description?: { en?: string; pt?: string } } }>(
          'select amount, image, document from product where id = $1',
          [productId],
        );
        assert.equal(Number(row.rows[0]?.amount), 50);
        assert.equal(row.rows[0]?.image, `/shop/media/${productId}`);
        assert.equal(row.rows[0]?.document.amount, 50);
        assert.equal(row.rows[0]?.document.image, `/shop/media/${productId}`);
        assert.equal(row.rows[0]?.document.description?.en, description);
        assert.equal(row.rows[0]?.document.description?.pt, description);
        const counts = await client.query<{ size: string; count: number }>('select size, count from stock_count where product_id = $1 order by size', [productId]);
        assert.equal(counts.rows.length, 5);
        assert.equal(Number(counts.rows.find((item) => item.size === 'M')?.count), 2);

        const edited = readShopProductDraft({
          id: productId,
          name: title,
          description,
          amount: '55',
          stock: { P: 0, M: 4, G: 0, GG: 0, '2XL': 0 },
          imageAction: 'keep',
        });
        assert.equal(edited.imageChange.kind, 'keep');
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
          await saveShopProduct({ ...edited, imageChange: { kind: 'replace', image: replacement } }, 'admin-check');
          const replaced = await readProductImage(productId);
          assert.equal(replaced?.bytes[20], replacement[20]);
          const stillStored = await client.query('select product_id from product_image where product_id = $1', [productId]);
          assert.equal(stillStored.rowCount, 0);
        }

        const removed = readShopProductDraft({
          id: productId,
          name: title,
          description,
          amount: '55',
          stock: { P: 0, M: 4, G: 0, GG: 0, '2XL': 0 },
          imageAction: 'remove',
        });
        await saveShopProduct(removed, 'admin-check');
        const cleared = await client.query<{ image: string; document: { image?: unknown; description?: { en?: string; pt?: string } } }>(
          'select image, document from product where id = $1',
          [productId],
        );
        assert.equal(cleared.rows[0]?.image, '');
        assert.equal(cleared.rows[0]?.document.image, '');
        assert.equal(cleared.rows[0]?.document.description?.en, description);
        assert.equal(cleared.rows[0]?.document.description?.pt, description);
        assert.equal(await readProductImage(productId), undefined);
        const missing = await api.request(`/product-image/${productId}`);
        assert.equal(missing.status, 404);
        assert.deepEqual(await missing.json(), { error: 'not found' });
        const clearedRow = await client.query('select product_id from product_image where product_id = $1', [productId]);
        assert.equal(clearedRow.rowCount, 0);

        await saveShopProduct({ ...removed, imageChange: { kind: 'replace', image: new Uint8Array(png) } }, 'admin-check');
        const restored = await client.query<{ image: string; document: { image?: unknown } }>('select image, document from product where id = $1', [productId]);
        assert.equal(restored.rows[0]?.image, `/shop/media/${productId}`);
        assert.equal(restored.rows[0]?.document.image, `/shop/media/${productId}`);
        const back = await readProductImage(productId);
        assert.equal(back?.contentType, 'image/png');
        assert.equal(Buffer.from(back?.bytes ?? []).equals(png), true);
        const present = await api.request(`/product-image/${productId}`);
        assert.equal(present.status, 200);
        const body: unknown = await present.json();
        assert.equal(typeof body === 'object' && body !== null && 'contentType' in body ? body.contentType : undefined, 'image/png');
        const restoredRow = await client.query('select product_id from product_image where product_id = $1', [productId]);
        assert.equal(restoredRow.rowCount, assetsBucketName() ? 0 : 1);

        const plain = await saveShopProduct(
          readShopProductDraft({
            name: `Plain Shirt ${suffix}`,
            description: 'No photo yet.',
            amount: '40',
            stock: { P: 0, M: 0, G: 0, GG: 0, '2XL': 0 },
            imageAction: 'keep',
          }),
          'admin-check',
        );
        remember(createdIds, plain.id);
        const plainRow = await client.query<{ image: string; document: { image?: unknown; description?: { en?: string; pt?: string } } }>(
          'select image, document from product where id = $1',
          [plain.id],
        );
        assert.equal(plainRow.rows[0]?.image, '');
        assert.equal(plainRow.rows[0]?.document.image, '');
        assert.equal(plainRow.rows[0]?.document.description?.en, 'No photo yet.');
        assert.equal(plainRow.rows[0]?.document.description?.pt, 'No photo yet.');
        assert.equal(await readProductImage(plain.id), undefined);
        assert.equal((await api.request(`/product-image/${plain.id}`)).status, 404);
        const plainStored = await client.query('select product_id from product_image where product_id = $1', [plain.id]);
        assert.equal(plainStored.rowCount, 0);
      } finally {
        const owned = createdIds.filter((id) => !catalogIds.has(id));
        try {
          if (owned.length > 0 && assetsBucketName()) {
            for (const id of owned) {
              await deleteShopImage(id);
            }
          }
        } finally {
          try {
            if (owned.length > 0) {
              await client.query('delete from stock_correction where product_id = any($1::text[])', [owned]);
              await client.query('delete from product where id = any($1::text[])', [owned]);
            }
          } finally {
            await client.end();
            await closeStoredDatabase();
          }
        }
      }
    });

    it('hides a shirt from the public catalog, keeps it for an admin, and deletes that shirt', async () => {
      const suffix = randomBytes(3).toString('hex');
      const title = `Hidden Shirt ${suffix}`;
      const client = new pg.Client({
        host: settings.host,
        port: settings.port,
        user: settings.user,
        password: settings.password,
        database: settings.database,
        ssl: databaseTls(),
      });
      await client.connect();
      const createdIds: string[] = [];
      const protectedIds = async (): Promise<string[]> => {
        const rows = await client.query<{ id: string }>('select id from product where id = any($1::text[]) order by id', [['hw', 'pg']]);
        return rows.rows.map((row) => row.id);
      };
      const before = await protectedIds();
      try {
        const created = await saveShopProduct(
          readShopProductDraft({
            ...productInput(1),
            name: title,
            description: 'Stored out of the public shop.',
            amount: '40',
            hidden: true,
          }),
          'admin-check',
        );
        remember(createdIds, created.id);
        const productId = created.id;
        const hiddenRow = await client.query<{ document: { hidden?: unknown } }>('select document from product where id = $1', [productId]);
        assert.equal(hiddenRow.rows[0]?.document.hidden, true);
        assert.equal(productIds(await loadProductCatalog()).includes(productId), false);
        const response = await api.request('/products');
        assert.equal(response.status, 200);
        const body: unknown = await response.json();
        assert.equal(productIds(isRecord(body) && Array.isArray(body.products) ? body.products : []).includes(productId), false);
        const listed = await listAdminShopProducts();
        const adminProduct = listed.find((item) => isRecord(item) && item.id === productId);
        assert.equal(isRecord(adminProduct) && adminProduct.hidden, true);
        const read = await readAdminShopProduct(productId);
        assert.equal(isRecord(read) && read.hidden, true);
        assert.equal(await readAdminShopProduct('not safe'), undefined);

        await saveShopProduct(
          readShopProductDraft({
            id: productId,
            name: title,
            description: 'Stored out of the public shop.',
            amount: '40',
            stock: { P: 0, M: 1, G: 0, GG: 0, '2XL': 0 },
            imageAction: 'keep',
          }),
          'admin-check',
        );
        const preserved = await client.query<{ document: { hidden?: unknown } }>('select document from product where id = $1', [productId]);
        assert.equal(preserved.rows[0]?.document.hidden, true);
        assert.equal(productIds(await loadProductCatalog()).includes(productId), false);

        await saveShopProduct(
          readShopProductDraft({
            id: productId,
            name: title,
            description: 'Stored out of the public shop.',
            amount: '40',
            stock: { P: 0, M: 1, G: 0, GG: 0, '2XL': 0 },
            imageAction: 'keep',
            hidden: false,
          }),
          'admin-check',
        );
        assert.equal(productIds(await loadProductCatalog()).includes(productId), true);
        const visible = await readAdminShopProduct(productId);
        assert.equal(isRecord(visible) && visible.hidden, false);

        const corrections = await client.query('select id from stock_correction where product_id = $1', [productId]);
        assert.equal(corrections.rowCount, 1);
        const image = await readProductImage(productId);
        assert.equal(image?.contentType, 'image/png');

        const deleted = await deleteShopProduct(productId);
        assert.equal(deleted.id, productId);
        assert.equal((await client.query('select id from product where id = $1', [productId])).rowCount, 0);
        assert.equal((await client.query('select product_id from stock_count where product_id = $1', [productId])).rowCount, 0);
        assert.equal((await client.query('select product_id from product_image where product_id = $1', [productId])).rowCount, 0);
        assert.equal((await client.query('select id from stock_correction where product_id = $1', [productId])).rowCount, 0);
        assert.equal(await readProductImage(productId), undefined);
        assert.equal((await api.request(`/product-image/${productId}`)).status, 404);
        assert.equal(await readAdminShopProduct(productId), undefined);
        if (assetsBucketName()) {
          assert.equal(await readShopImage(productId), undefined);
        }
        await assert.rejects(() => deleteShopProduct(productId), /product was not deleted/);
        await assert.rejects(() => deleteShopProduct(`missing-${suffix}`), /product was not deleted/);
      } finally {
        const owned = createdIds.filter((id) => !catalogIds.has(id));
        try {
          assert.deepEqual(await protectedIds(), before);
        } finally {
          try {
            if (owned.length > 0 && assetsBucketName()) {
              for (const id of owned) {
                await deleteShopImage(id);
              }
            }
          } finally {
            try {
              if (owned.length > 0) {
                await client.query('delete from stock_correction where product_id = any($1::text[])', [owned]);
                await client.query('delete from product where id = any($1::text[])', [owned]);
              }
            } finally {
              await client.end();
              await closeStoredDatabase();
            }
          }
        }
      }
    });
  }
});
