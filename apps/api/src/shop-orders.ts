import { randomBytes } from 'node:crypto';
import {
  containsCardNumber,
  parseOrder,
  parsePaymentTrace,
  parseStockCorrection,
  type Order,
  type OrderDelivery,
  type PaymentTrace,
  type StockCorrection,
} from 'tropical-nomads-shared';
import { loadAccounts } from './accounts.ts';
import { databaseSettings } from './database.ts';
import { insertStoredRecord, queueDatabase, runInTransaction, type StoredQuery } from './sql-store.ts';

const stockSizes = ['P', 'M', 'G', 'GG', '2XL'] as const;
type StockSize = (typeof stockSizes)[number];

export interface ShopPurchaseLine {
  productId: string;
  size: string;
  quantity: number;
}

export interface ShopPurchaseAddress {
  name: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface ShopPurchaseRequest {
  lines: ShopPurchaseLine[];
  address: ShopPurchaseAddress;
}

export interface ShopShelfProduct {
  id: string;
  amount: number;
  currency: string;
}

export interface ShopShelfCount {
  productId: string;
  size: StockSize;
  count: number;
}

export interface ShopShelf {
  products: readonly ShopShelfProduct[];
  counts: readonly ShopShelfCount[];
}

export interface ShopStockChange {
  productId: string;
  size: StockSize;
  quantity: number;
  oldCount: number;
  nextCount: number;
}

export interface PlannedShopPurchase {
  order: Order;
  trace: PaymentTrace;
  corrections: StockCorrection[];
  changes: ShopStockChange[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSize(value: string): value is StockSize {
  return (stockSizes as readonly string[]).includes(value);
}

function clean(value: string): string {
  return value.replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function catalogAmount(value: unknown): number | undefined {
  const amount = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000 || !/^\d+(\.\d{1,2})?$/.test(amount.toString())) {
    return undefined;
  }
  return amount;
}

function catalogCurrency(value: unknown): string | undefined {
  const currency = typeof value === 'string' && value.trim() !== '' ? value.trim().toUpperCase() : 'EUR';
  if (!/^[A-Z]{3}$/.test(currency)) {
    return undefined;
  }
  return currency;
}

function catalogCount(value: unknown): number | undefined {
  const count = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isInteger(count) || count < 0) {
    return undefined;
  }
  return count;
}

function newId(prefix: string): string {
  return `${prefix}-${randomBytes(9).toString('hex')}`;
}

function byShelf(left: { productId: string; size: string }, right: { productId: string; size: string }): number {
  if (left.productId < right.productId) return -1;
  if (left.productId > right.productId) return 1;
  if (left.size < right.size) return -1;
  if (left.size > right.size) return 1;
  return 0;
}

function addMoney(total: number, amount: number, quantity: number): number {
  return Math.round(total * 100 + amount * 100 * quantity) / 100;
}

export function readShopPurchase(input: unknown): ShopPurchaseRequest {
  if (!isRecord(input) || !Array.isArray(input.lines) || input.lines.length === 0 || input.lines.length > 20 || !isRecord(input.address)) {
    throw new Error('order was not accepted');
  }
  const lines = input.lines.map((line) => {
    if (!isRecord(line) || typeof line.productId !== 'string' || typeof line.size !== 'string' || typeof line.quantity !== 'number') {
      throw new Error('order was not accepted');
    }
    return { productId: line.productId, size: line.size, quantity: line.quantity };
  });
  const address = input.address;
  return {
    lines,
    address: {
      name: text(address.name),
      line1: text(address.line1),
      line2: text(address.line2),
      city: text(address.city),
      region: text(address.region),
      postalCode: text(address.postalCode),
      country: text(address.country),
    },
  };
}

function deliveryOf(address: ShopPurchaseAddress): OrderDelivery {
  const name = clean(address.name);
  const line1 = clean(address.line1);
  const line2 = clean(address.line2);
  const city = clean(address.city);
  const region = clean(address.region);
  const postalCode = clean(address.postalCode);
  const country = clean(address.country);
  if (!name || !line1 || !city || !postalCode || !country || containsCardNumber({ name, line1, line2, city, region, postalCode, country })) {
    throw new Error('order was not accepted');
  }
  const delivery: OrderDelivery = { name, line1, city, postalCode, country };
  if (line2) delivery.line2 = line2;
  if (region) delivery.region = region;
  return delivery;
}

/**
 * Prices and stock come from the shelf. The trace stays pending because the site does not charge the card.
 * The stock change is the commitment: the shirts are no longer available to the next buyer.
 */
export function planShopPurchase(shelf: ShopShelf, request: ShopPurchaseRequest, userId: string, now: string): PlannedShopPurchase {
  const buyer = userId.trim();
  if (buyer === '' || buyer.length > 120 || /[\u0000-\u001f]/.test(buyer)) {
    throw new Error('order was not accepted');
  }
  const delivery = deliveryOf(request.address);
  const merged = new Map<string, { productId: string; size: StockSize; quantity: number }>();
  for (const line of request.lines) {
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(line.productId) || !isSize(line.size) || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99) {
      throw new Error('order was not accepted');
    }
    const key = `${line.productId}\n${line.size}`;
    const quantity = (merged.get(key)?.quantity ?? 0) + line.quantity;
    if (quantity > 99) {
      throw new Error('order was not accepted');
    }
    merged.set(key, { productId: line.productId, size: line.size, quantity });
  }
  if (merged.size === 0) {
    throw new Error('order was not accepted');
  }
  const lines = [...merged.values()].sort(byShelf);
  const changes: ShopStockChange[] = [];
  let currency = '';
  let total = 0;
  for (const line of lines) {
    const product = shelf.products.find((item) => item.id === line.productId);
    if (!product) {
      throw new Error('order was not accepted');
    }
    if (currency === '') {
      currency = product.currency;
    }
    if (product.currency !== currency) {
      throw new Error('order was not accepted');
    }
    const row = shelf.counts.find((item) => item.productId === line.productId && item.size === line.size);
    if (!row || line.quantity > row.count) {
      throw new Error('sold out');
    }
    total = addMoney(total, product.amount, line.quantity);
    changes.push({ productId: line.productId, size: line.size, quantity: line.quantity, oldCount: row.count, nextCount: row.count - line.quantity });
  }
  if (total <= 0 || total > 100000 || !/^\d+(\.\d{1,2})?$/.test(total.toString())) {
    throw new Error('order was not accepted');
  }
  const orderId = newId('order');
  const traceId = newId('trace');
  const trace = parsePaymentTrace({
    id: traceId,
    userId: buyer,
    amount: total,
    currency,
    purpose: 'shop',
    reference: orderId,
    status: 'pending_provider',
  });
  const order = parseOrder({
    id: orderId,
    userId: buyer,
    purpose: 'shop',
    lines: lines.map((line) => ({ kind: 'shop', productId: line.productId, size: line.size, quantity: line.quantity })),
    traceId,
    createdAt: now,
    delivery,
  });
  const corrections: StockCorrection[] = [];
  for (const change of changes) {
    const correction = parseStockCorrection({
      id: newId('stock'),
      productId: change.productId,
      size: change.size,
      actorId: buyer,
      at: now,
      oldCount: change.oldCount,
      newCount: change.nextCount,
    });
    if (!correction.ok) {
      throw new Error('order was not accepted');
    }
    corrections.push(correction.value);
  }
  if (!trace.ok || !order.ok) {
    throw new Error('order was not accepted');
  }
  return { order: order.value, trace: trace.value, corrections, changes };
}

async function readShelf(client: StoredQuery): Promise<ShopShelf> {
  const counts = await client.query('select product_id, size, count from stock_count order by product_id, size for update');
  const products = await client.query('select id, amount, currency from product order by id');
  return {
    products: products.rows.flatMap((row) => {
      const id = typeof row.id === 'string' ? row.id : '';
      const amount = catalogAmount(row.amount);
      const currency = catalogCurrency(row.currency);
      return id !== '' && amount !== undefined && currency !== undefined ? [{ id, amount, currency }] : [];
    }),
    counts: counts.rows.flatMap((row) => {
      const productId = typeof row.product_id === 'string' ? row.product_id : '';
      const size = typeof row.size === 'string' && isSize(row.size) ? row.size : undefined;
      const count = catalogCount(row.count);
      return productId !== '' && size !== undefined && count !== undefined ? [{ productId, size, count }] : [];
    }),
  };
}

async function writePurchase(client: StoredQuery, planned: PlannedShopPurchase): Promise<void> {
  for (const change of planned.changes) {
    const updated = await client.query(
      'update stock_count set count = count - $3 where product_id = $1 and size = $2 and count >= $3 returning count',
      [change.productId, change.size, change.quantity],
    );
    if (updated.rowCount !== 1 || Number(updated.rows[0]?.count) !== change.nextCount) {
      throw new Error('sold out');
    }
  }
  for (const correction of planned.corrections) {
    await client.query(
      `insert into stock_correction (id, product_id, size, actor_id, at, old_count, new_count, document)
       values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
      [
        correction.id,
        correction.productId,
        correction.size,
        correction.actorId,
        correction.at,
        correction.oldCount,
        correction.newCount,
        JSON.stringify(correction),
      ],
    );
  }
  await insertStoredRecord(client, 'payment-traces', planned.trace);
  await insertStoredRecord(client, 'orders', planned.order);
}

async function buyerId(sessionUserId: string | undefined): Promise<string> {
  if (sessionUserId === undefined || sessionUserId.trim() === '') {
    return newId('guest');
  }
  const accounts = await loadAccounts();
  const profile = accounts.profiles.find((item) => item.sub === sessionUserId && item.status === 'active');
  if (!profile) {
    throw new Error('order was not accepted');
  }
  return sessionUserId;
}

export async function placeShopOrder(request: ShopPurchaseRequest, sessionUserId?: string): Promise<{ orderId: string }> {
  if (!databaseSettings()) {
    throw new Error('order was not saved');
  }
  try {
    const userId = await buyerId(sessionUserId);
    return await queueDatabase(() =>
      runInTransaction(async (client) => {
        const planned = planShopPurchase(await readShelf(client), request, userId, new Date().toISOString());
        await writePurchase(client, planned);
        return { orderId: planned.order.id };
      }),
    );
  } catch (error) {
    if (error instanceof Error && (error.message === 'sold out' || error.message === 'order was not accepted')) {
      throw error;
    }
    throw new Error('order was not saved');
  }
}
