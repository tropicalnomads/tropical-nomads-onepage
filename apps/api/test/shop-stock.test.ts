import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import pg from 'pg';
import { parseOrder, parsePaymentTrace } from 'tropical-nomads-shared';
import { databaseSettings, databaseTls } from '../src/database.ts';
import { closeStoredDatabase } from '../src/sql-store.ts';
import { commitOrderPaid, markOrderPaid, reconcileUnpaidShopStock, shopStockAdjustments, type StockLedgerEntry, type StockOrder } from '../src/shop-stock.ts';

const envFile = resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env');
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const now = '2026-11-12T15:00:00.000Z';

function order(id: string, status: StockOrder['status']): StockOrder {
  return {
    id,
    userId: 'guest-1',
    createdAt: now,
    status,
    lines: [{ productId: 'hw', size: 'M', quantity: 1 }],
  };
}

function legacy(): StockLedgerEntry {
  return { productId: 'hw', size: 'M', actorId: 'guest-1', at: now, oldCount: 3, newCount: 2 };
}

describe('shop stock adjustments', () => {
  it('returns held stock for an unpaid order once, and takes stock only after it is paid', () => {
    const pending = order('order-aaaaaaaaaaaaaaaaaa', 'pending_provider');
    const release = shopStockAdjustments([pending], [legacy()]);
    assert.deepEqual(
      release.map((item) => [item.direction, item.quantity, item.orderId]),
      [['release', 1, pending.id]],
    );
    const released = shopStockAdjustments(
      [pending],
      [legacy(), { ...legacy(), oldCount: 2, newCount: 3, orderId: pending.id, reason: 'unpaid-release' }],
    );
    assert.deepEqual(released, []);
    assert.deepEqual(shopStockAdjustments([pending], []), []);
    const confirmed = order('order-aaaaaaaaaaaaaaaaaa', 'confirmed');
    assert.deepEqual(
      shopStockAdjustments([confirmed], []).map((item) => [item.direction, item.quantity]),
      [['take', 1]],
    );
    assert.deepEqual(shopStockAdjustments([confirmed], [legacy()]), []);
    const other = order('order-bbbbbbbbbbbbbbbbbb', 'pending_provider');
    assert.equal(shopStockAdjustments([pending, other], [legacy()]).length, 1);
  });

  it('refuses a buyer who is not an admin', async () => {
    await assert.rejects(() => markOrderPaid(undefined, 'order-aaaaaaaaaaaaaaaaaa'), /request was not accepted/);
    await assert.rejects(() => markOrderPaid('door-1', 'order-aaaaaaaaaaaaaaaaaa'), /request was not accepted/);
    await assert.rejects(() => markOrderPaid('user-1', 'order-cccccccccccccccccc'), /request was not accepted/);
  });

  const settings = databaseSettings();
  if (settings) {
    it('restores a held unpaid order once, then takes stock when that order is marked paid', async () => {
      const client = new pg.Client({
        host: settings.host,
        port: settings.port,
        user: settings.user,
        password: settings.password,
        database: settings.database,
        ssl: databaseTls(),
      });
      await client.connect();
      const buyer = `guest-${randomBytes(9).toString('hex')}`;
      const heldId = `order-${randomBytes(9).toString('hex')}`;
      const paidId = `order-${randomBytes(9).toString('hex')}`;
      const shortId = `order-${randomBytes(9).toString('hex')}`;
      const heldTrace = `trace-${randomBytes(9).toString('hex')}`;
      const paidTrace = `trace-${randomBytes(9).toString('hex')}`;
      const shortTrace = `trace-${randomBytes(9).toString('hex')}`;
      const ticketId = `order-${randomBytes(9).toString('hex')}`;
      const ticketTrace = `trace-${randomBytes(9).toString('hex')}`;
      const created = [heldId, paidId, shortId, ticketId];
      const traces = [heldTrace, paidTrace, shortTrace, ticketTrace];
      const productId = `stock-check-${randomBytes(6).toString('hex')}`;
      const size = 'M';
      const original = 4;
      try {
        await client.query(
          `insert into product (id, name, image, alt, amount, currency, pickup, stock_note, document)
           values ($1, 'Stock check', '/shop/media/stock-check', 'Stock check', 50, 'EUR', 'Lisbon', 'In stock', $2::jsonb)`,
          [productId, JSON.stringify({ id: productId, name: 'Stock check', image: '/shop/media/stock-check', alt: 'Stock check', amount: 50, currency: 'EUR', pickup: 'Lisbon', stockNote: 'In stock' })],
        );
        await client.query('insert into stock_count (product_id, size, count) values ($1, $2, $3)', [productId, size, original]);
        await client.query('update stock_count set count = count - 1 where product_id = $1 and size = $2', [productId, size]);
        await insertShop(client, heldId, heldTrace, buyer, productId, size, 1, 'pending_provider', now);
        await client.query(
          `insert into stock_correction (id, product_id, size, actor_id, at, old_count, new_count, document)
           values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
          [
            `stock-${randomBytes(9).toString('hex')}`,
            productId,
            size,
            buyer,
            now,
            original,
            original - 1,
            JSON.stringify({ id: 'stock-legacy', productId, size, actorId: buyer, at: now, oldCount: original, newCount: original - 1 }),
          ],
        );
        await reconcileUnpaidShopStock();
        const restored = await client.query<{ count: number }>('select count from stock_count where product_id = $1 and size = $2', [productId, size]);
        assert.equal(Number(restored.rows[0]?.count), original);
        await reconcileUnpaidShopStock();
        const again = await client.query<{ count: number }>('select count from stock_count where product_id = $1 and size = $2', [productId, size]);
        assert.equal(Number(again.rows[0]?.count), original);

        await insertShop(client, paidId, paidTrace, buyer, productId, size, 1, 'pending_provider', '2026-11-12T16:00:00.000Z');
        const paid = await commitOrderPaid('admin-stock', paidId);
        assert.equal(paid.status, 'confirmed');
        const taken = await client.query<{ count: number }>('select count from stock_count where product_id = $1 and size = $2', [productId, size]);
        assert.equal(Number(taken.rows[0]?.count), original - 1);
        await commitOrderPaid('admin-stock', paidId);
        const held = await client.query<{ count: number }>('select count from stock_count where product_id = $1 and size = $2', [productId, size]);
        assert.equal(Number(held.rows[0]?.count), original - 1);

        await insertShop(client, shortId, shortTrace, buyer, productId, size, original, 'pending_provider', '2026-11-12T17:00:00.000Z');
        await assert.rejects(() => commitOrderPaid('admin-stock', shortId), /sold out/);
        const status = await client.query<{ status: string }>('select status from payment_trace where id = $1', [shortTrace]);
        const untouched = await client.query<{ count: number }>('select count from stock_count where product_id = $1 and size = $2', [productId, size]);
        assert.equal(status.rows[0]?.status, 'pending_provider');
        assert.equal(Number(untouched.rows[0]?.count), original - 1);

        const beforeTicket = Number(untouched.rows[0]?.count);
        await insertTicket(client, ticketId, ticketTrace, buyer);
        const confirmedTicket = await commitOrderPaid('admin-stock', ticketId);
        assert.equal(confirmedTicket.status, 'confirmed');
        const afterTicket = await client.query<{ count: number }>('select count from stock_count where product_id = $1 and size = $2', [productId, size]);
        const issued = await client.query<{ count: number }>('select count(*)::int as count from issued_ticket where trace_id = $1', [ticketTrace]);
        assert.equal(Number(afterTicket.rows[0]?.count), beforeTicket);
        assert.equal(Number(issued.rows[0]?.count), 0);
      } finally {
        await client.query('delete from stock_correction where product_id = $1 or actor_id = $2 or document->>\'orderId\' = any($3::text[])', [productId, buyer, created]);
        await client.query('delete from customer_order where id = any($1::text[])', [created]);
        await client.query('delete from payment_trace where id = any($1::text[])', [traces]);
        await client.query('delete from stock_count where product_id = $1', [productId]);
        await client.query('delete from product where id = $1', [productId]);
        await client.end();
        await closeStoredDatabase();
      }
    });
  }
});

async function insertTicket(client: pg.Client, orderId: string, traceId: string, buyer: string): Promise<void> {
  const trace = parsePaymentTrace({
    id: traceId,
    userId: buyer,
    amount: 20,
    currency: 'EUR',
    purpose: 'tickets',
    reference: orderId,
    status: 'pending_provider',
  });
  const stored = parseOrder({
    id: orderId,
    userId: buyer,
    purpose: 'tickets',
    lines: [{ kind: 'ticket', partyId: 'party-stock', offerName: 'Friday', quantity: 1 }],
    traceId,
    createdAt: '2026-11-12T18:00:00.000Z',
  });
  assert.equal(trace.ok, true);
  assert.equal(stored.ok, true);
  if (!trace.ok || !stored.ok) {
    return;
  }
  await client.query(
    `insert into payment_trace (id, user_id, amount, currency, purpose, reference, status, document)
     values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
    [trace.value.id, trace.value.userId, trace.value.amount, trace.value.currency, trace.value.purpose, trace.value.reference, trace.value.status, JSON.stringify(trace.value)],
  );
  await client.query(
    `insert into customer_order (id, user_id, purpose, lines, trace_id, created_at, document)
     values ($1, $2, $3, $4::jsonb, $5, $6, $7::jsonb)`,
    [stored.value.id, stored.value.userId, stored.value.purpose, JSON.stringify(stored.value.lines), stored.value.traceId, stored.value.createdAt, JSON.stringify(stored.value)],
  );
}

async function insertShop(
  client: pg.Client,
  orderId: string,
  traceId: string,
  buyer: string,
  productId: string,
  size: string,
  quantity: number,
  status: 'pending_provider' | 'confirmed',
  createdAt: string,
): Promise<void> {
  const trace = parsePaymentTrace({
    id: traceId,
    userId: buyer,
    amount: 50,
    currency: 'EUR',
    purpose: 'shop',
    reference: orderId,
    status,
  });
  const stored = parseOrder({
    id: orderId,
    userId: buyer,
    purpose: 'shop',
    lines: [{ kind: 'shop', productId, size, quantity }],
    traceId,
    createdAt,
    delivery: { name: 'Stock Check', line1: 'Rua 1', city: 'Lisbon', postalCode: '1000', country: 'Portugal' },
  });
  assert.equal(trace.ok, true);
  assert.equal(stored.ok, true);
  if (!trace.ok || !stored.ok) {
    return;
  }
  await client.query(
    `insert into payment_trace (id, user_id, amount, currency, purpose, reference, status, document)
     values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
    [trace.value.id, trace.value.userId, trace.value.amount, trace.value.currency, trace.value.purpose, trace.value.reference, trace.value.status, JSON.stringify(trace.value)],
  );
  await client.query(
    `insert into customer_order (id, user_id, purpose, lines, trace_id, created_at, document)
     values ($1, $2, $3, $4::jsonb, $5, $6, $7::jsonb)`,
    [stored.value.id, stored.value.userId, stored.value.purpose, JSON.stringify(stored.value.lines), stored.value.traceId, stored.value.createdAt, JSON.stringify(stored.value)],
  );
}
