import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
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
  it('prices the order from the catalog and keeps the address without taking stock', () => {
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
    assert.deepEqual(planned.changes, []);
    assert.deepEqual(planned.corrections, []);
    assert.equal(stock.counts[0]?.count, 1);
    assert.equal(parseOrder(planned.order).ok, true);
    const again = planShopPurchase(stock, request([{ productId: 'hw', size: 'M', quantity: 1 }]), 'guest-2', now);
    assert.equal(again.trace.status, 'pending_provider');
    assert.equal(stock.counts[0]?.count, 1);
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
    it('saves one pending order without reducing stock, and leaves the database unchanged when the next buy does not fit', async () => {
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
      const productId = `order-check-${randomBytes(6).toString('hex')}`;
      const size = 'M';
      const original = 3;
      const amount = 40;
      try {
        await client.query(
          `insert into product (id, name, image, alt, amount, currency, pickup, stock_note, document)
           values ($1, 'Order check', '/shop/media/order-check', 'Order check', $2, 'EUR', 'Lisbon', 'In stock', $3::jsonb)`,
          [productId, amount, JSON.stringify({ id: productId, name: 'Order check', image: '/shop/media/order-check', alt: 'Order check', amount, currency: 'EUR', pickup: 'Lisbon', stockNote: 'In stock' })],
        );
        await client.query('insert into stock_count (product_id, size, count) values ($1, $2, $3)', [productId, size, original]);
        const ordersForProduct = async () => {
          const rows = await client.query<{ count: number }>(
            `select count(*)::int as count from customer_order
             where exists (select 1 from jsonb_array_elements(lines) line where line->>'productId' = $1)`,
            [productId],
          );
          return Number(rows.rows[0]?.count);
        };
        const beforeCount = await ordersForProduct();
        await assert.rejects(
          () => placeShopOrder(request([{ productId, size, quantity: original + 1 }]), undefined),
          /sold out/,
        );
        const midwayCount = await ordersForProduct();
        const held = await client.query<{ count: number }>('select count from stock_count where product_id = $1 and size = $2', [productId, size]);
        assert.equal(midwayCount, beforeCount);
        assert.equal(Number(held.rows[0]?.count), original);

        const placed = await placeShopOrder(
          request([{ productId, size, quantity: 1 }], { ...address, name: 'Order Check' }),
          undefined,
        );
        created.push(placed.orderId);
        const after = await client.query<{ count: number }>('select count from stock_count where product_id = $1 and size = $2', [productId, size]);
        assert.equal(Number(after.rows[0]?.count), original);
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
        const correction = await client.query<{ count: number }>(
          'select count(*)::int as count from stock_correction where actor_id = $1 and product_id = $2 and size = $3',
          [document?.userId, productId, size],
        );
        assert.equal(Number(correction.rows[0]?.count), 0);

        await assert.rejects(
          () => placeShopOrder(request([{ productId, size, quantity: original + 1 }]), undefined),
          /sold out/,
        );
        const finalOrders = await ordersForProduct();
        const finalCount = await client.query<{ count: number }>('select count from stock_count where product_id = $1 and size = $2', [productId, size]);
        assert.equal(finalOrders, beforeCount + 1);
        assert.equal(Number(finalCount.rows[0]?.count), original);
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
        await client.query('delete from stock_count where product_id = $1', [productId]);
        await client.query('delete from product where id = $1', [productId]);
        await client.end();
        await closeStoredDatabase();
      }
    });
  }
});
