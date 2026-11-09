import { liveSizes, type ShopSizeCode } from '../../../one-pager/src/lib/shop.ts';
import { shopProducts, type ShopAddress, type ShopLine } from './order.ts';

export const shopCartStorageKey = 'tn:shop-cart:v1';

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

function isProduct(value: unknown): value is ShopLine['productId'] {
  return value === 'hw' || value === 'pg';
}

export function sizeStock(productId: ShopLine['productId'], size: ShopSizeCode): number {
  const product = shopProducts().find((item) => item.id === productId);
  if (!product) {
    return 0;
  }
  return liveSizes(product).find((item) => item.code === size)?.count ?? 0;
}

export function clampShopLines(lines: readonly ShopLine[]): ShopLine[] {
  const merged = new Map<string, ShopLine>();
  for (const line of lines) {
    const stock = sizeStock(line.productId, line.size);
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || stock < 1) {
      continue;
    }
    const key = `${line.productId}:${line.size}`;
    const previous = merged.get(key)?.quantity ?? 0;
    merged.set(key, { productId: line.productId, size: line.size, quantity: Math.min(stock, previous + line.quantity) });
  }
  return [...merged.values()];
}

export function addShopLine(lines: readonly ShopLine[], line: ShopLine): ShopLine[] {
  return clampShopLines([...lines, line]);
}

export function setShopLineQuantity(lines: readonly ShopLine[], productId: ShopLine['productId'], size: ShopSizeCode, quantity: number): ShopLine[] {
  if (!Number.isInteger(quantity) || quantity < 1) {
    return lines.filter((line) => line.productId !== productId || line.size !== size);
  }
  const stock = sizeStock(productId, size);
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

export function parseShopCart(raw: string | null): StoredShopCart {
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
          if (!isProduct(line.productId) || !isSize(line.size) || typeof line.quantity !== 'number') {
            return [];
          }
          return [{ productId: line.productId, size: line.size, quantity: line.quantity }];
        })
      : [];
    return { lines: clampShopLines(lines), address: readAddress(record.address) };
  } catch {
    return { lines: [], address: emptyShopAddress };
  }
}
