import type { ShopProduct, ShopSizeCode, ShopSizeStock } from '../../../one-pager/src/lib/shop.ts';
import { apiOrigin } from '../api-origin.ts';
import { shopProducts } from './order.ts';

const sizeCodes = ['P', 'M', 'G', 'GG', '2XL'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSize(value: unknown): value is ShopSizeCode {
  return typeof value === 'string' && sizeCodes.some((code) => code === value);
}

function parseProduct(value: unknown): ShopProduct | undefined {
  if (!isRecord(value) || (value.id !== 'hw' && value.id !== 'pg')) {
    return undefined;
  }
  if (typeof value.name !== 'string' || typeof value.whatsappItem !== 'string' || typeof value.image !== 'string' || typeof value.imageAlt !== 'string') {
    return undefined;
  }
  if (typeof value.highlighted !== 'boolean' || (value.stockNote !== 'lastRun' && value.stockNote !== 'madeToOrder') || !Array.isArray(value.stock)) {
    return undefined;
  }
  const stock: ShopSizeStock[] = [];
  for (const size of value.stock) {
    if (!isRecord(size) || !isSize(size.code) || typeof size.count !== 'number') {
      return undefined;
    }
    stock.push({ code: size.code, count: size.count });
  }
  return {
    id: value.id,
    name: value.name,
    whatsappItem: value.whatsappItem,
    image: value.image,
    imageAlt: value.imageAlt,
    highlighted: value.highlighted,
    stockNote: value.stockNote,
    stock,
  };
}

export async function loadShopProducts(): Promise<ShopProduct[]> {
  const origin = apiOrigin();
  if (!origin) {
    return [...shopProducts()];
  }
  const response = await fetch(`${origin}/products`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('products are unavailable');
  }
  const body: unknown = await response.json();
  if (!isRecord(body) || !Array.isArray(body.products)) {
    throw new Error('products are unavailable');
  }
  const products = body.products.flatMap((item) => {
    const product = parseProduct(item);
    return product === undefined ? [] : [product];
  });
  if (products.length !== body.products.length) {
    throw new Error('products are unavailable');
  }
  return products;
}
