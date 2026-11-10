import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import pg from 'pg';
import { parseOrder } from 'tropical-nomads-shared';
import { databaseSettings, databaseTls } from '../src/database.ts';
import { closeStoredDatabase } from '../src/sql-store.ts';
import { planShopPurchase, placeShopOrder, readShopPurchase, type ShopPurchaseRequest, type ShopShelf } from '../src/shop-orders.ts';

const envFile = resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env');
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const now = '2026-11-10T15:00:00.000Z';

const address: ShopPurchaseRequest['address'] = {
  name: 'Ada Lovelace',
  line1: 'Rua da Loja 1',
  line2: '',
  city: 'Lisbon',
  region: 'Lisbon',
  postalCode: '1000-001',
  country: 'Portugal',
};

function shelf(): ShopShelf {
  return {
    products: [
      { id: 'hw', amount: 50, currency: 'EUR' },
      { id: 'pg', amount: 50, currency: 'EUR' },
    ],
    counts: [
      { productId: 'hw', size: 'M', count: 1 },
      { productId: 'pg', size: 'G', count: 2 },
    ],
  };
}

function request(lines: ShopPurchaseRequest['lines'], delivery: ShopPurchaseRequest['address'] = address): ShopPurchaseRequest {
  return { lines, address: delivery };
}

describe('shop orders', () => {
  it('prices the order from the catalog, keeps the address, and spends the last unit once', () => {
    const stock = shelf();
    const bought = readShopPurchase({
      lines: [
        { productId: 'hw', size: 'M', quantity: 1, amount: 1 },
        { productId: 'pg', size: 'G', quantity: 1 },
        { productId: 'pg', size: 'G', quantity: 1 },
      ],
      address,
      userId: 'intruder',
    });
    const planned = planShopPurchase(stock, bought, 'guest-1', now);
    assert.equal(planned.trace.amount, 150);
    assert.equal(planned.trace.currency, 'EUR');
    assert.equal(planned.trace.purpose, 'shop');
    assert.equal(planned.trace.status, 'pending_provider');
    assert.equal(planned.trace.userId, 'guest-1');
    assert.equal(planned.trace.reference, planned.order.id);
    assert.equal(planned.order.purpose, 'shop');
    assert.equal(planned.order.delivery?.name, 'Ada Lovelace');
    assert.equal(planned.order.delivery?.line2, undefined);
    assert.deepEqual(
      planned.order.lines.map((line) => ({ productId: line.kind === 'shop' ? line.productId : '', size: line.kind === 'shop' ? line.size : '', quantity: line.quantity })),
      [
        { productId: 'hw', size: 'M', quantity: 1 },
        { productId: 'pg', size: 'G', quantity: 2 },
      ],
    );
    assert.deepEqual(
      planned.changes.map((change) => [change.productId, change.size, change.oldCount, change.nextCount]),
      [
        ['hw', 'M', 1, 0],
        ['pg', 'G', 2, 0],
      ],
    );
    assert.equal(stock.counts[0]?.count, 1);
    assert.equal(parseOrder(planned.order).ok, true);
    const spent = {
      products: stock.products,
      counts: stock.counts.map((row) => {
        const change = planned.changes.find((item) => item.productId === row.productId && item.size === row.size);
        return change ? { ...row, count: change.nextCount } : row;
      }),
    };
    assert.throws(() => planShopPurchase(spent, request([{ productId: 'hw', size: 'M', quantity: 1 }]), 'guest-2', now), /sold out/);
    assert.equal(spent.counts[0]?.count, 0);
  });

  it('refuses a quantity above stock without changing the counts', () => {
    const stock = shelf();
    assert.throws(() => planShopPurchase(stock, request([{ productId: 'hw', size: 'M', quantity: 2 }]), 'guest-1', now), /sold out/);
    assert.equal(stock.counts[0]?.count, 1);
    assert.equal(stock.counts[1]?.count, 2);
  });

  it('refuses an incomplete address, an unknown shirt, and mixed currencies', () => {
    const stock = shelf();
    assert.throws(() => planShopPurchase(stock, request([{ productId: 'hw', size: 'M', quantity: 1 }], { ...address, city: ' ' }), 'guest-1', now), /order was not accepted/);
    assert.throws(() => planShopPurchase(stock, request([{ productId: 'missing', size: 'M', quantity: 1 }]), 'guest-1', now), /order was not accepted/);
    assert.throws(
      () =>
        planShopPurchase(
          { products: [{ id: 'hw', amount: 50, currency: 'EUR' }, { id: 'pg', amount: 40, currency: 'USD' }], counts: shelf().counts },
          request([
            { productId: 'hw', size: 'M', quantity: 1 },
            { productId: 'pg', size: 'G', quantity: 1 },
          ]),
          'guest-1',
          now,
        ),
      /order was not accepted/,
    );
    assert.equal(stock.counts[0]?.count, 1);
    assert.throws(() => readShopPurchase({ lines: [], address }), /order was not accepted/);
  });

  const settings = databaseSettings();
  if (settings) {
    it('saves one order, reduces that size, and leaves the database unchanged when the next buy does not fit', async () => {
      const client = new pg.Client({
        host: settings.host,
        port: settings.port,
        user: settings.user,
        password: settings.password,
        database: settings.database,
        ssl: databaseTls(),
      });
      await client.connect();
      const created: string[] = [];
      let productId = '';
      let size = '';
      try {
        const stock = await client.query<{ product_id: string; size: string; count: number }>(
          'select product_id, size, count from stock_count where count > 0 order by product_id, size limit 1',
        );
        const row = stock.rows[0];
        assert.ok(row);
        productId = row.product_id;
        size = row.size;
        const original = Number(row.count);
        const product = await client.query<{ amount: string; currency: string | null }>('select amount, currency from product where id = $1', [productId]);
        const amount = Number(product.rows[0]?.amount);
        const before = await client.query<{ count: number }>('select count(*)::int as count from customer_order');
        const beforeCount = Number(before.rows[0]?.count);
        await assert.rejects(
          () => placeShopOrder(request([{ productId, size, quantity: original + 1 }]), undefined),
          /sold out/,
        );
        const midway = await client.query<{ count: number }>('select count(*)::int as count from customer_order');
        const held = await client.query<{ count: number }>('select count from stock_count where product_id = $1 and size = $2', [productId, size]);
        assert.equal(Number(midway.rows[0]?.count), beforeCount);
        assert.equal(Number(held.rows[0]?.count), original);

        const placed = await placeShopOrder(
          request([{ productId, size, quantity: 1 }], { ...address, name: 'Order Check' }),
          undefined,
        );
        created.push(placed.orderId);
        const after = await client.query<{ count: number }>('select count from stock_count where product_id = $1 and size = $2', [productId, size]);
        assert.equal(Number(after.rows[0]?.count), original - 1);
        const saved = await client.query<{ document: { purpose?: string; traceId?: string; userId?: string; delivery?: { name?: string }; lines?: { quantity?: number }[] } }>(
          'select document from customer_order where id = $1',
          [placed.orderId],
        );
        const document = saved.rows[0]?.document;
        assert.equal(document?.purpose, 'shop');
        assert.equal(document?.delivery?.name, 'Order Check');
        assert.equal(document?.lines?.[0]?.quantity, 1);
        const trace = await client.query<{ amount: string; status: string; purpose: string }>('select amount, status, purpose from payment_trace where id = $1', [
          document?.traceId,
        ]);
        assert.equal(Number(trace.rows[0]?.amount), amount);
        assert.equal(trace.rows[0]?.status, 'pending_provider');
        assert.equal(trace.rows[0]?.purpose, 'shop');
        const correction = await client.query<{ old_count: number; new_count: number }>(
          'select old_count, new_count from stock_correction where actor_id = $1 and product_id = $2 and size = $3',
          [document?.userId, productId, size],
        );
        assert.equal(Number(correction.rows[0]?.old_count), original);
        assert.equal(Number(correction.rows[0]?.new_count), original - 1);

        await assert.rejects(
          () => placeShopOrder(request([{ productId, size, quantity: original }]), undefined),
          /sold out/,
        );
        const orders = await client.query<{ count: number }>('select count(*)::int as count from customer_order');
        const finalCount = await client.query<{ count: number }>('select count from stock_count where product_id = $1 and size = $2', [productId, size]);
        assert.equal(Number(orders.rows[0]?.count), beforeCount + 1);
        assert.equal(Number(finalCount.rows[0]?.count), original - 1);
      } finally {
        for (const orderId of created) {
          const order = await client.query<{ user_id: string; trace_id: string }>('select user_id, trace_id from customer_order where id = $1', [orderId]);
          const buyer = order.rows[0]?.user_id;
          const traceId = order.rows[0]?.trace_id;
          if (buyer) {
            await client.query('delete from stock_correction where actor_id = $1', [buyer]);
          }
          await client.query('delete from customer_order where id = $1', [orderId]);
          if (traceId) {
            await client.query('delete from payment_trace where id = $1', [traceId]);
          }
        }
        if (created.length > 0 && productId !== '' && size !== '') {
          await client.query('update stock_count set count = count + $3 where product_id = $1 and size = $2', [productId, size, created.length]);
        }
        await client.end();
        await closeStoredDatabase();
      }
    });
  }
});
