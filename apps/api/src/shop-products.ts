import { randomBytes } from 'node:crypto';
import { containsCardNumber, parseOrder, type Order } from 'tropical-nomads-shared';
import { loadAccounts } from './accounts.ts';
import { databaseSettings } from './database.ts';
import { assetsBucketName, putShopImage, readShopImage, shopImageType } from './object-store.ts';
import { queueDatabase, runInTransaction, type StoredQuery } from './sql-store.ts';

const stockSizes = ['P', 'M', 'G', 'GG', '2XL'] as const;
type StockSize = (typeof stockSizes)[number];

const textLimit = 600;
const pickup = 'The Sound House · Dublin';

export interface ShopProductDraft {
  id?: string;
  name: string;
  descriptionEn: string;
  descriptionPt: string;
  amount: number;
  stock: Record<StockSize, number>;
  image?: Uint8Array;
}

export interface ShopOrderSummary {
  id: string;
  createdAt: string;
  buyer: string;
  city: string;
  country: string;
  lines: { name: string; size: string; quantity: number }[];
  amount: number;
  currency: string;
  status: 'pending_provider' | 'confirmed';
}

export interface StoredProductImage {
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  bytes: Uint8Array;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function clean(value: string, limit: number): string {
  return value.replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, limit);
}

function euroAmount(value: unknown): number | undefined {
  const amount = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : Number.NaN;
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000 || !/^\d+(\.\d{1,2})?$/.test(amount.toString())) {
    return undefined;
  }
  return amount;
}

export function productSlug(title: string): string {
  const base = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
    .replace(/-+$/g, '');
  return base.length >= 2 ? base : 'shirt';
}

export function imageKind(bytes: Uint8Array): StoredProductImage['contentType'] | undefined {
  return shopImageType(bytes);
}

function stockCount(value: unknown): number | undefined {
  const count = typeof value === 'number' ? value : typeof value === 'string' && /^\d{1,3}$/.test(value) ? Number(value) : Number.NaN;
  if (!Number.isInteger(count) || count < 0 || count > 999) {
    return undefined;
  }
  return count;
}

export function readShopProductDraft(input: unknown): ShopProductDraft {
  if (!isRecord(input) || typeof input.name !== 'string' || typeof input.descriptionEn !== 'string' || typeof input.descriptionPt !== 'string' || !isRecord(input.stock)) {
    throw new Error('product was not saved');
  }
  const name = clean(input.name, 80);
  const descriptionEn = clean(input.descriptionEn, textLimit);
  const descriptionPt = clean(input.descriptionPt, textLimit);
  const amount = euroAmount(input.amount);
  if (!name || !descriptionEn || !descriptionPt || amount === undefined || containsCardNumber({ name, descriptionEn, descriptionPt })) {
    throw new Error('product was not saved');
  }
  const stock = {} as Record<StockSize, number>;
  for (const size of stockSizes) {
    const count = stockCount(input.stock[size]);
    if (count === undefined) {
      throw new Error('product was not saved');
    }
    stock[size] = count;
  }
  const id = typeof input.id === 'string' && input.id.trim() !== '' ? input.id.trim() : undefined;
  if (id !== undefined && !/^[A-Za-z0-9_-]{1,40}$/.test(id)) {
    throw new Error('product was not saved');
  }
  let image: Uint8Array | undefined;
  if (typeof input.imageBase64 === 'string' && input.imageBase64 !== '') {
    if (input.imageBase64.length > 7_000_000) {
      throw new Error('product was not saved');
    }
    const bytes = new Uint8Array(Buffer.from(input.imageBase64, 'base64'));
    if (!imageKind(bytes)) {
      throw new Error('product was not saved');
    }
    image = bytes;
  }
  return { ...(id ? { id } : {}), name, descriptionEn, descriptionPt, amount, stock, ...(image ? { image } : {}) };
}

function newId(prefix: string): string {
  return `${prefix}-${randomBytes(9).toString('hex')}`;
}

async function nextProductId(client: StoredQuery, title: string): Promise<string> {
  const rows = await client.query('select id from product');
  const taken = new Set(rows.rows.map((row) => (typeof row.id === 'string' ? row.id : '')));
  const base = productSlug(title);
  if (!taken.has(base)) {
    return base;
  }
  for (let suffix = 2; suffix < 50; suffix += 1) {
    const tail = `-${suffix}`;
    const id = `${base.slice(0, 40 - tail.length)}${tail}`;
    if (!taken.has(id)) {
      return id;
    }
  }
  return `shirt-${randomBytes(4).toString('hex')}`;
}

function documentFor(
  id: string,
  draft: ShopProductDraft,
  image: string,
  existing: Record<string, unknown> | undefined,
): Record<string, unknown> {
  return {
    ...(existing ?? {}),
    id,
    name: draft.name,
    description: { en: draft.descriptionEn, pt: draft.descriptionPt },
    image,
    imageAlt: draft.name,
    amount: draft.amount,
    currency: 'EUR',
    pickup: typeof existing?.pickup === 'string' && existing.pickup.trim() !== '' ? existing.pickup : pickup,
    stockNote: typeof existing?.stockNote === 'string' && existing.stockNote.trim() !== '' ? existing.stockNote : 'madeToOrder',
    highlighted: existing?.highlighted === true,
    whatsappItem: draft.name,
  };
}

export async function saveShopProduct(draft: ShopProductDraft, actorId: string): Promise<{ id: string }> {
  if (!databaseSettings() || actorId.trim() === '') {
    throw new Error('product was not saved');
  }
  try {
    return await queueDatabase(() =>
      runInTransaction(async (client) => {
        const existingId = draft.id;
        const current = existingId
          ? await client.query('select document, image, pickup, stock_note from product where id = $1 for update', [existingId])
          : undefined;
        if (existingId && current?.rowCount !== 1) {
          throw new Error('product was not saved');
        }
        if (!existingId && !draft.image) {
          throw new Error('product was not saved');
        }
        const id = existingId ?? (await nextProductId(client, draft.name));
        const previous = current?.rows[0];
        const existingDocument = isRecord(previous?.document) ? previous.document : undefined;
        const previousImage = typeof previous?.image === 'string' ? previous.image : '';
        const image = draft.image ? `/shop/media/${id}` : previousImage;
        if (image === '') {
          throw new Error('product was not saved');
        }
        const document = documentFor(id, draft, image, existingDocument);
        const pickupValue = typeof document.pickup === 'string' ? document.pickup : pickup;
        const stockNote = typeof document.stockNote === 'string' ? document.stockNote : 'madeToOrder';
        if (existingId) {
          await client.query(
            `update product
             set name = $2, image = $3, alt = $4, amount = $5, currency = 'EUR', document = $6::jsonb
             where id = $1`,
            [id, draft.name, image, draft.name, draft.amount, JSON.stringify(document)],
          );
        } else {
          await client.query(
            `insert into product (id, name, image, alt, amount, currency, pickup, stock_note, document)
             values ($1, $2, $3, $4, $5, 'EUR', $6, $7, $8::jsonb)`,
            [id, draft.name, image, draft.name, draft.amount, pickupValue, stockNote, JSON.stringify(document)],
          );
        }
        const locked = await client.query('select size, count from stock_count where product_id = $1 order by size for update', [id]);
        const previousCounts = new Map<string, number>();
        for (const row of locked.rows) {
          if (typeof row.size === 'string') {
            previousCounts.set(row.size, Number(row.count));
          }
        }
        const now = new Date().toISOString();
        for (const size of stockSizes) {
          const next = draft.stock[size];
          const oldCount = previousCounts.get(size) ?? 0;
          await client.query(
            `insert into stock_count (product_id, size, count) values ($1, $2, $3)
             on conflict (product_id, size) do update set count = excluded.count`,
            [id, size, next],
          );
          if (oldCount === next) {
            continue;
          }
          const correction = {
            id: newId('stock'),
            productId: id,
            size,
            actorId,
            at: now,
            oldCount,
            newCount: next,
          };
          await client.query(
            `insert into stock_correction (id, product_id, size, actor_id, at, old_count, new_count, document)
             values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
            [correction.id, id, size, actorId, now, oldCount, next, JSON.stringify(correction)],
          );
        }
        if (draft.image) {
          const contentType = imageKind(draft.image);
          if (!contentType) {
            throw new Error('product was not saved');
          }
          if (assetsBucketName()) {
            await putShopImage(id, draft.image);
          } else {
            await client.query(
              `insert into product_image (product_id, content_type, bytes) values ($1, $2, $3)
               on conflict (product_id) do update set content_type = excluded.content_type, bytes = excluded.bytes`,
              [id, contentType, Buffer.from(draft.image)],
            );
          }
        }
        return { id };
      }),
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'product was not saved') {
      throw error;
    }
    throw new Error('product was not saved');
  }
}

export async function requireShopAdmin(sessionUserId: string | undefined): Promise<string> {
  if (!sessionUserId || sessionUserId.trim() === '') {
    throw new Error('request was not accepted');
  }
  const accounts = await loadAccounts();
  const profile = accounts.profiles.find((item) => item.sub === sessionUserId && item.status === 'active' && item.role === 'admin');
  if (!profile) {
    throw new Error('request was not accepted');
  }
  return sessionUserId;
}

function lineSummary(line: Order['lines'][number], names: Map<string, string>): ShopOrderSummary['lines'][number] {
  switch (line.kind) {
    case 'shop':
      return { name: names.get(line.productId) ?? line.productId, size: line.size, quantity: line.quantity };
    case 'ticket':
      return { name: line.offerName, size: '', quantity: line.quantity };
    default: {
      const unexpected: never = line;
      return unexpected;
    }
  }
}

function traceStatus(value: unknown): ShopOrderSummary['status'] | undefined {
  switch (value) {
    case 'pending_provider':
    case 'confirmed':
      return value;
    default:
      return undefined;
  }
}

export async function listShopOrders(): Promise<ShopOrderSummary[]> {
  if (!databaseSettings()) {
    throw new Error('orders are unavailable');
  }
  const result = await runInTransaction(async (client) => {
    const orders = await client.query(
      `select customer_order.document, payment_trace.amount, payment_trace.currency, payment_trace.status
       from customer_order
       join payment_trace on payment_trace.id = customer_order.trace_id
       where customer_order.purpose = 'shop'
       order by customer_order.created_at desc
       limit 50`,
    );
    const products = await client.query('select id, name from product');
    return { orders: orders.rows, products: products.rows };
  });
  const names = new Map(result.products.flatMap((row) => (typeof row.id === 'string' && typeof row.name === 'string' ? [[row.id, row.name] as const] : [])));
  const summaries: ShopOrderSummary[] = [];
  for (const row of result.orders) {
    const parsed = parseOrder(row.document);
    const status = traceStatus(row.status);
    const amount = Number(row.amount);
    if (!parsed.ok || parsed.value.purpose !== 'shop' || !status || !Number.isFinite(amount) || typeof row.currency !== 'string') {
      continue;
    }
    const delivery = parsed.value.delivery;
    summaries.push({
      id: parsed.value.id,
      createdAt: parsed.value.createdAt,
      buyer: delivery?.name ?? '',
      city: delivery?.city ?? '',
      country: delivery?.country ?? '',
      lines: parsed.value.lines.map((line) => lineSummary(line, names)),
      amount,
      currency: row.currency,
      status,
    });
  }
  return summaries;
}

export async function readProductImage(productId: string): Promise<StoredProductImage | undefined> {
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(productId)) {
    return undefined;
  }
  if (assetsBucketName()) {
    return readShopImage(productId);
  }
  if (!databaseSettings()) {
    return undefined;
  }
  const rows = await runInTransaction((client) => client.query('select content_type, bytes from product_image where product_id = $1', [productId]));
  const row = rows.rows[0];
  const contentType = row?.content_type;
  const bytes = row?.bytes;
  if ((contentType !== 'image/jpeg' && contentType !== 'image/png' && contentType !== 'image/webp') || !Buffer.isBuffer(bytes)) {
    return undefined;
  }
  return { contentType, bytes: new Uint8Array(bytes) };
}
