import { randomBytes } from 'node:crypto';
import { parseOrder, type Order } from 'tropical-nomads-shared';
import { databaseSettings } from './database.ts';
import { requireShopAdmin } from './shop-products.ts';
import { queueDatabase, runInTransaction, type StoredQuery } from './sql-store.ts';

const stockSizes = ['P', 'M', 'G', 'GG', '2XL'] as const;
type StockSize = (typeof stockSizes)[number];

export interface StockLine {
  productId: string;
  size: string;
  quantity: number;
}

export interface StockOrder {
  id: string;
  userId: string;
  createdAt: string;
  status: 'pending_provider' | 'confirmed';
  lines: readonly StockLine[];
}

export interface StockLedgerEntry {
  productId: string;
  size: string;
  actorId: string;
  at: string;
  oldCount: number;
  newCount: number;
  orderId?: string;
  reason?: string;
}

export interface StockAdjustment {
  orderId: string;
  buyerId: string;
  productId: string;
  size: StockSize;
  quantity: number;
  direction: 'release' | 'take';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSize(value: string): value is StockSize {
  return (stockSizes as readonly string[]).includes(value);
}

function documentOf(value: unknown): Record<string, unknown> | undefined {
  if (typeof value === 'string') {
    try {
      return documentOf(JSON.parse(value) as unknown);
    } catch {
      return undefined;
    }
  }
  return isRecord(value) ? value : undefined;
}

function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function mergedLines(lines: readonly StockLine[]): StockLine[] {
  const merged = new Map<string, StockLine>();
  for (const line of lines) {
    if (!isSize(line.size) || !Number.isInteger(line.quantity) || line.quantity < 1) {
      continue;
    }
    const key = `${line.productId}\n${line.size}`;
    const current = merged.get(key);
    merged.set(key, {
      productId: line.productId,
      size: line.size,
      quantity: (current?.quantity ?? 0) + line.quantity,
    });
  }
  return [...merged.values()];
}

function directQuantity(ledger: readonly StockLedgerEntry[], orderId: string, productId: string, size: string, reason: 'paid' | 'unpaid-release'): number {
  let total = 0;
  for (const entry of ledger) {
    if (entry.orderId !== orderId || entry.productId !== productId || entry.size !== size || entry.reason !== reason) {
      continue;
    }
    const delta = reason === 'paid' ? entry.oldCount - entry.newCount : entry.newCount - entry.oldCount;
    if (delta > 0) {
      total += delta;
    }
  }
  return total;
}

/**
 * Pending shop orders give back stock they still hold. Confirmed shop orders take stock they have not taken yet.
 * A legacy decrement has no order id and is matched once by buyer, time, product, and size.
 */
export function shopStockAdjustments(orders: readonly StockOrder[], ledger: readonly StockLedgerEntry[]): StockAdjustment[] {
  const legacy = new Map<string, number>();
  for (const entry of ledger) {
    if (entry.orderId !== undefined) {
      continue;
    }
    const delta = entry.oldCount - entry.newCount;
    if (delta <= 0) {
      continue;
    }
    const key = `${entry.actorId}\n${entry.at}\n${entry.productId}\n${entry.size}`;
    legacy.set(key, (legacy.get(key) ?? 0) + delta);
  }
  const adjustments: StockAdjustment[] = [];
  const sorted = [...orders].sort((left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));
  for (const order of sorted) {
    for (const line of mergedLines(order.lines)) {
      if (!isSize(line.size)) {
        continue;
      }
      const taken = directQuantity(ledger, order.id, line.productId, line.size, 'paid');
      const released = directQuantity(ledger, order.id, line.productId, line.size, 'unpaid-release');
      const legacyKey = `${order.userId}\n${order.createdAt}\n${line.productId}\n${line.size}`;
      const available = legacy.get(legacyKey) ?? 0;
      const legacyTaken = Math.min(available, Math.max(0, line.quantity - taken));
      legacy.set(legacyKey, available - legacyTaken);
      const net = taken + legacyTaken - released;
      const adjustment = adjustmentFor(order, line.productId, line.size, line.quantity, net);
      if (adjustment) {
        adjustments.push(adjustment);
      }
    }
  }
  return adjustments;
}

function adjustmentFor(order: StockOrder, productId: string, size: StockSize, quantity: number, net: number): StockAdjustment | undefined {
  switch (order.status) {
    case 'pending_provider':
      if (net <= 0) {
        return undefined;
      }
      return { orderId: order.id, buyerId: order.userId, productId, size, quantity: Math.min(net, quantity), direction: 'release' };
    case 'confirmed':
      if (net >= quantity) {
        return undefined;
      }
      return {
        orderId: order.id,
        buyerId: order.userId,
        productId,
        size,
        quantity: Math.min(quantity, quantity - net),
        direction: 'take',
      };
    default: {
      const unexpected: never = order.status;
      return unexpected;
    }
  }
}

async function loadShopStockOrders(client: StoredQuery): Promise<StockOrder[]> {
  const rows = await client.query(
    `select customer_order.document as order_document, payment_trace.status as status
     from customer_order
     join payment_trace on payment_trace.id = customer_order.trace_id
     where customer_order.purpose = 'shop'`,
  );
  const orders: StockOrder[] = [];
  for (const row of rows.rows) {
    const parsed = parseOrder(documentOf(row.order_document));
    const status = row.status === 'pending_provider' || row.status === 'confirmed' ? row.status : undefined;
    if (!parsed.ok || parsed.value.purpose !== 'shop' || !status) {
      continue;
    }
    orders.push({
      id: parsed.value.id,
      userId: parsed.value.userId,
      createdAt: parsed.value.createdAt,
      status,
      lines: shopLines(parsed.value),
    });
  }
  return orders;
}

function shopLines(order: Order): StockLine[] {
  const lines: StockLine[] = [];
  for (const line of order.lines) {
    switch (line.kind) {
      case 'shop':
        lines.push({ productId: line.productId, size: line.size, quantity: line.quantity });
        break;
      case 'ticket':
        break;
      default: {
        const unexpected: never = line;
        return unexpected;
      }
    }
  }
  return lines;
}

async function loadLedger(client: StoredQuery): Promise<StockLedgerEntry[]> {
  const rows = await client.query('select product_id, size, actor_id, at, old_count, new_count, document from stock_correction');
  const ledger: StockLedgerEntry[] = [];
  for (const row of rows.rows) {
    const productId = typeof row.product_id === 'string' ? row.product_id : '';
    const size = typeof row.size === 'string' ? row.size : '';
    const actorId = typeof row.actor_id === 'string' ? row.actor_id : '';
    const at = typeof row.at === 'string' ? row.at : '';
    const oldCount = Number(row.old_count);
    const newCount = Number(row.new_count);
    if (productId === '' || size === '' || actorId === '' || at === '' || !Number.isInteger(oldCount) || !Number.isInteger(newCount)) {
      continue;
    }
    const document = documentOf(row.document);
    const entry: StockLedgerEntry = { productId, size, actorId, at, oldCount, newCount };
    const orderId = optionalText(document?.orderId);
    const reason = optionalText(document?.reason);
    if (orderId) {
      entry.orderId = orderId;
    }
    if (reason) {
      entry.reason = reason;
    }
    ledger.push(entry);
  }
  return ledger;
}

async function insertCorrection(
  client: StoredQuery,
  adjustment: StockAdjustment,
  actorId: string,
  at: string,
  oldCount: number,
  newCount: number,
): Promise<void> {
  const id = `stock-${randomBytes(9).toString('hex')}`;
  const reason = adjustment.direction === 'release' ? 'unpaid-release' : 'paid';
  const document = {
    id,
    productId: adjustment.productId,
    size: adjustment.size,
    actorId,
    at,
    oldCount,
    newCount,
    orderId: adjustment.orderId,
    reason,
  };
  await client.query(
    `insert into stock_correction (id, product_id, size, actor_id, at, old_count, new_count, document)
     values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
    [id, adjustment.productId, adjustment.size, actorId, at, oldCount, newCount, JSON.stringify(document)],
  );
}

async function applyAdjustment(client: StoredQuery, adjustment: StockAdjustment, actorId: string, at: string): Promise<boolean> {
  switch (adjustment.direction) {
    case 'release': {
      const updated = await client.query(
        'update stock_count set count = count + $3 where product_id = $1 and size = $2 returning count',
        [adjustment.productId, adjustment.size, adjustment.quantity],
      );
      const count = Number(updated.rows[0]?.count);
      if (updated.rowCount !== 1 || !Number.isInteger(count)) {
        return false;
      }
      await insertCorrection(client, adjustment, actorId, at, count - adjustment.quantity, count);
      return true;
    }
    case 'take': {
      const updated = await client.query(
        'update stock_count set count = count - $3 where product_id = $1 and size = $2 and count >= $3 returning count',
        [adjustment.productId, adjustment.size, adjustment.quantity],
      );
      const count = Number(updated.rows[0]?.count);
      if (updated.rowCount !== 1 || !Number.isInteger(count)) {
        return false;
      }
      await insertCorrection(client, adjustment, actorId, at, count + adjustment.quantity, count);
      return true;
    }
    default: {
      const unexpected: never = adjustment.direction;
      return unexpected;
    }
  }
}

export async function reconcileShopStock(client: StoredQuery): Promise<void> {
  await client.query('select product_id from stock_count for update');
  const adjustments = shopStockAdjustments(await loadShopStockOrders(client), await loadLedger(client));
  const at = new Date().toISOString();
  for (const adjustment of adjustments) {
    await applyAdjustment(client, adjustment, adjustment.buyerId, at);
  }
}

export async function reconcileUnpaidShopStock(): Promise<void> {
  if (!databaseSettings()) {
    return;
  }
  await queueDatabase(() => runInTransaction((client) => reconcileShopStock(client)));
}

async function lockedOrder(client: StoredQuery, orderId: string): Promise<{ order: Order; status: 'pending_provider' | 'confirmed' } | undefined> {
  const rows = await client.query(
    `select customer_order.document as order_document, payment_trace.status as status
     from customer_order
     join payment_trace on payment_trace.id = customer_order.trace_id
     where customer_order.id = $1
     for update of customer_order, payment_trace`,
    [orderId],
  );
  const row = rows.rows[0];
  if (!row) {
    return undefined;
  }
  const parsed = parseOrder(documentOf(row.order_document));
  const status = row.status === 'pending_provider' || row.status === 'confirmed' ? row.status : undefined;
  if (!parsed.ok || !status) {
    return undefined;
  }
  return { order: parsed.value, status };
}

async function countsFor(client: StoredQuery): Promise<Map<string, number>> {
  const rows = await client.query('select product_id, size, count from stock_count for update');
  const counts = new Map<string, number>();
  for (const row of rows.rows) {
    const productId = typeof row.product_id === 'string' ? row.product_id : '';
    const size = typeof row.size === 'string' ? row.size : '';
    const count = Number(row.count);
    if (productId !== '' && size !== '' && Number.isInteger(count)) {
      counts.set(`${productId}\n${size}`, count);
    }
  }
  return counts;
}

async function confirmTrace(client: StoredQuery, traceId: string): Promise<void> {
  const updated = await client.query(
    `update payment_trace
     set status = 'confirmed', document = jsonb_set(document, '{status}', '"confirmed"'::jsonb)
     where id = $1 and status = 'pending_provider'`,
    [traceId],
  );
  if (updated.rowCount !== 1) {
    throw new Error('order was not found');
  }
}

export async function commitOrderPaid(actorId: string, orderId: string): Promise<{ id: string; status: 'confirmed' }> {
  if (!databaseSettings()) {
    throw new Error('orders are unavailable');
  }
  if (!/^order-[a-f0-9]{18}$/.test(orderId)) {
    throw new Error('order was not found');
  }
  return queueDatabase(() =>
    runInTransaction(async (client) => {
      const counts = await countsFor(client);
      const locked = await lockedOrder(client, orderId);
      if (!locked) {
        throw new Error('order was not found');
      }
      if (locked.status === 'confirmed') {
        return { id: locked.order.id, status: 'confirmed' as const };
      }
      const takes = shopStockAdjustments(
        [
          {
            id: locked.order.id,
            userId: locked.order.userId,
            createdAt: locked.order.createdAt,
            status: 'confirmed',
            lines: shopLines(locked.order),
          },
        ],
        await loadLedger(client),
      ).filter((adjustment) => adjustment.direction === 'take');
      for (const take of takes) {
        if ((counts.get(`${take.productId}\n${take.size}`) ?? 0) < take.quantity) {
          throw new Error('sold out');
        }
      }
      const at = new Date().toISOString();
      for (const take of takes) {
        const applied = await applyAdjustment(client, take, actorId, at);
        if (!applied) {
          throw new Error('sold out');
        }
      }
      await confirmTrace(client, locked.order.traceId);
      return { id: locked.order.id, status: 'confirmed' as const };
    }),
  );
}

export async function markOrderPaid(sessionUserId: string | undefined, orderId: string): Promise<{ id: string; status: 'confirmed' }> {
  const actorId = await requireShopAdmin(sessionUserId);
  return commitOrderPaid(actorId, orderId);
}
