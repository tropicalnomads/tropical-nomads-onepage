import { cache } from 'react';
import type { ShopSizeCode, ShopSizeStock } from '../../../one-pager/src/lib/shop.ts';
import { apiOrigin } from '../api-origin.ts';
import type { ShopCatalogProduct } from './catalog.ts';

const sizeCodes = ['P', 'M', 'G', 'GG', '2XL'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSize(value: unknown): value is ShopSizeCode {
  return typeof value === 'string' && sizeCodes.some((code) => code === value);
}

function parseDescription(value: unknown): ShopCatalogProduct['description'] | undefined {
  if (value === undefined) {
    return { en: '', pt: '' };
  }
  if (!isRecord(value) || typeof value.en !== 'string' || value.en.trim() === '' || typeof value.pt !== 'string' || value.pt.trim() === '') {
    return undefined;
  }
  return { en: value.en, pt: value.pt };
}

function parseProduct(value: unknown): ShopCatalogProduct | undefined {
  if (!isRecord(value) || typeof value.id !== 'string' || value.id.trim() === '') {
    return undefined;
  }
  if (typeof value.name !== 'string' || value.name.trim() === '' || typeof value.image !== 'string' || typeof value.imageAlt !== 'string') {
    return undefined;
  }
  if (typeof value.amount !== 'number' || !Number.isFinite(value.amount) || value.amount < 0 || typeof value.currency !== 'string' || value.currency.trim() === '') {
    return undefined;
  }
  const description = parseDescription(value.description);
  if (!description || !Array.isArray(value.stock)) {
    return undefined;
  }
  const stock: ShopSizeStock[] = [];
  for (const size of value.stock) {
    if (!isRecord(size) || !isSize(size.code) || typeof size.count !== 'number' || !Number.isInteger(size.count) || size.count < 0) {
      return undefined;
    }
    stock.push({ code: size.code, count: size.count });
  }
  return {
    id: value.id,
    name: value.name,
    description,
    image: value.image,
    imageAlt: value.imageAlt,
    amount: value.amount,
    currency: value.currency,
    stock,
  };
}

export function parseAdminProductCatalog(body: unknown): ShopCatalogProduct[] {
  if (!Array.isArray(body)) {
    throw new Error('products are unavailable');
  }
  const products = body.flatMap((item) => {
    const product = parseProduct(item);
    if (!product || !isRecord(item)) {
      return [];
    }
    return [{ ...product, hidden: item.hidden === true }];
  });
  if (products.length !== body.length) {
    throw new Error('products are unavailable');
  }
  return products;
}

export function parseShopCatalog(body: unknown): ShopCatalogProduct[] {
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

export const loadShopProducts = cache(async (): Promise<ShopCatalogProduct[]> => {
  const origin = apiOrigin();
  if (!origin) {
    throw new Error('products are unavailable');
  }
  const response = await fetch(`${origin}/products`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('products are unavailable');
  }
  return parseShopCatalog(await response.json());
});
