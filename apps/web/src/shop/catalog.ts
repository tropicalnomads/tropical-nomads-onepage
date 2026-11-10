import type { Locale } from 'tropical-nomads-shared';
import type { ShopSizeCode, ShopSizeStock } from '../../../one-pager/src/lib/shop.ts';

export interface ShopCatalogProduct {
  id: string;
  name: string;
  description: Record<Locale, string>;
  image: string;
  imageAlt: string;
  amount: number;
  currency: string;
  stock: ShopSizeStock[];
}

const sizeOrder: readonly ShopSizeCode[] = ['P', 'M', 'G', 'GG', '2XL'];

export function inStockSizes(stock: readonly ShopSizeStock[]): ShopSizeStock[] {
  return stock.filter((size) => size.count > 0);
}

export function catalogSizes(stock: readonly ShopSizeStock[]): ShopSizeStock[] {
  return sizeOrder.map((code) => ({ code, count: stock.find((item) => item.code === code)?.count ?? 0 }));
}

export function stockCount(stock: readonly ShopSizeStock[]): number {
  return inStockSizes(stock).reduce((sum, size) => sum + size.count, 0);
}

export function sizeStock(products: readonly Pick<ShopCatalogProduct, 'id' | 'stock'>[], productId: string, size: ShopSizeCode): number {
  const product = products.find((item) => item.id === productId);
  if (!product) {
    return 0;
  }
  return inStockSizes(product.stock).find((item) => item.code === size)?.count ?? 0;
}

export function shopProductDescription(product: ShopCatalogProduct, language: Locale): string {
  switch (language) {
    case 'en':
      return product.description.en;
    case 'pt':
      return product.description.pt;
    default: {
      const unexpected: never = language;
      return unexpected;
    }
  }
}

export function shopAmountLabel(amount: number, currency: string): string {
  if (currency === 'EUR') {
    return `€${amount}`;
  }
  return `${amount} ${currency}`;
}
