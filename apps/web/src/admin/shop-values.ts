import type { ShopSizeCode } from '../../../one-pager/src/lib/shop.ts';
import { catalogSizes, type ShopCatalogProduct } from '../shop/catalog.ts';

export const shopSizeCodes = ['P', 'M', 'G', 'GG', '2XL'] as const satisfies readonly ShopSizeCode[];

export interface ShopProductValues {
  id: string;
  name: string;
  descriptionEn: string;
  descriptionPt: string;
  amount: string;
  stock: Record<ShopSizeCode, number>;
  image?: string;
}

export const emptyShopProduct: ShopProductValues = {
  id: '',
  name: '',
  descriptionEn: '',
  descriptionPt: '',
  amount: '',
  stock: { P: 0, M: 0, G: 0, GG: 0, '2XL': 0 },
};

export function shopProductValues(product: ShopCatalogProduct, image?: string): ShopProductValues {
  const stock: ShopProductValues['stock'] = { P: 0, M: 0, G: 0, GG: 0, '2XL': 0 };
  for (const size of catalogSizes(product.stock)) {
    stock[size.code] = size.count;
  }
  return {
    id: product.id,
    name: product.name,
    descriptionEn: product.description.en,
    descriptionPt: product.description.pt,
    amount: String(product.amount),
    stock,
    ...(image ? { image } : {}),
  };
}

export interface ShopOrderRow {
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
