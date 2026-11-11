import type { ShopSizeCode } from '../../../one-pager/src/lib/shop.ts';
import { sizeStock, type ShopCatalogProduct } from './catalog.ts';
import type { ShopAddress, ShopLine } from './order.ts';

export const shopCartStorageKey = 'tn:shop-cart:v1';
export const shopCartCountCookie = 'tn:shop-count';

export function readShopCartCount(value: string | undefined): number {
  if (value === undefined || !/^\d{1,4}$/.test(value)) {
    return 0;
  }
  return Number(value);
}

export const emptyShopAddress: ShopAddress = {
  name: '',
  line1: '',
  line2: '',
  city: '',
  region: '',
  postalCode: '',
  country: '',
};

export interface StoredShopCart {
  lines: ShopLine[];
  address: ShopAddress;
}

const sizeCodes = ['P', 'M', 'G', 'GG', '2XL'] as const;

function isSize(value: unknown): value is ShopSizeCode {
  return typeof value === 'string' && sizeCodes.some((code) => code === value);
}

function isProductId(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

export function clampShopLines(lines: readonly ShopLine[], products: readonly Pick<ShopCatalogProduct, 'id' | 'stock'>[]): ShopLine[] {
  const merged = new Map<string, ShopLine>();
  for (const line of lines) {
    const stock = sizeStock(products, line.productId, line.size);
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || stock < 1) {
      continue;
    }
    const key = `${line.productId}:${line.size}`;
    const previous = merged.get(key)?.quantity ?? 0;
    merged.set(key, { productId: line.productId, size: line.size, quantity: Math.min(stock, previous + line.quantity) });
  }
  return [...merged.values()];
}

export function addShopLine(lines: readonly ShopLine[], line: ShopLine, products: readonly Pick<ShopCatalogProduct, 'id' | 'stock'>[]): ShopLine[] {
  return clampShopLines([...lines, line], products);
}

export function setShopLineQuantity(
  lines: readonly ShopLine[],
  productId: string,
  size: ShopSizeCode,
  quantity: number,
  products: readonly Pick<ShopCatalogProduct, 'id' | 'stock'>[],
): ShopLine[] {
  if (!Number.isInteger(quantity) || quantity < 1) {
    return lines.filter((line) => line.productId !== productId || line.size !== size);
  }
  const stock = sizeStock(products, productId, size);
  if (stock < 1) {
    return lines.filter((line) => line.productId !== productId || line.size !== size);
  }
  return lines.map((line) =>
    line.productId === productId && line.size === size ? { ...line, quantity: Math.min(stock, quantity) } : line,
  );
}

export function removeShopLine(lines: readonly ShopLine[], productId: ShopLine['productId'], size: ShopSizeCode): ShopLine[] {
  return lines.filter((line) => line.productId !== productId || line.size !== size);
}

export function shopPieceCount(lines: readonly ShopLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

function readAddress(value: unknown): ShopAddress {
  if (typeof value !== 'object' || value === null) {
    return emptyShopAddress;
  }
  const record = value as Partial<ShopAddress>;
  return {
    name: typeof record.name === 'string' ? record.name : '',
    line1: typeof record.line1 === 'string' ? record.line1 : '',
    line2: typeof record.line2 === 'string' ? record.line2 : '',
    city: typeof record.city === 'string' ? record.city : '',
    region: typeof record.region === 'string' ? record.region : '',
    postalCode: typeof record.postalCode === 'string' ? record.postalCode : '',
    country: typeof record.country === 'string' ? record.country : '',
  };
}

export function parseShopCart(raw: string | null, products?: readonly Pick<ShopCatalogProduct, 'id' | 'stock'>[]): StoredShopCart {
  if (!raw) {
    return { lines: [], address: emptyShopAddress };
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return { lines: [], address: emptyShopAddress };
    }
    const record = parsed as { lines?: unknown; address?: unknown };
    const lines = Array.isArray(record.lines)
      ? record.lines.flatMap((item) => {
          if (typeof item !== 'object' || item === null) {
            return [];
          }
          const line = item as Partial<ShopLine>;
          if (!isProductId(line.productId) || !isSize(line.size) || typeof line.quantity !== 'number') {
            return [];
          }
          return [{ productId: line.productId, size: line.size, quantity: line.quantity }];
        })
      : [];
    return { lines: products === undefined ? lines : clampShopLines(lines, products), address: readAddress(record.address) };
  } catch {
    return { lines: [], address: emptyShopAddress };
  }
}
