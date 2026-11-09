/** Edit counts here. 0 hides that size. */
export const SHOP_STOCK = {
  hw: [
    ['M', 3],
    ['G', 3],
    ['GG', 2],
  ],
  pg: [
    ['P', 3],
    ['M', 2],
    ['G', 1],
    ['2XL', 1],
  ],
} as const;

export const WHATSAPP_E164 = '351911891127';
export const WHATSAPP_DISPLAY = '+351 911 891 127';
export const SHOP_PRICE_EUR = 50;
export const SHOP_PICKUP = 'The Sound House · Dublin';

export type ShopSizeCode = 'P' | 'M' | 'G' | 'GG' | '2XL';

export const EN_SIZE: Record<ShopSizeCode, string> = {
  P: 'S',
  M: 'M',
  G: 'L',
  GG: 'XL',
  '2XL': '2XL',
};

export interface ShopSizeStock {
  code: ShopSizeCode;
  count: number;
}

export interface ShopProduct {
  id: 'hw' | 'pg';
  name: string;
  whatsappItem: string;
  image: string;
  imageAlt: string;
  highlighted: boolean;
  stockNote: 'lastRun' | 'madeToOrder';
  stock: ShopSizeStock[];
}

function stockFrom(
  rows: readonly (readonly [ShopSizeCode, number])[],
): ShopSizeStock[] {
  return rows.map(([code, count]) => ({ code, count }));
}

export const SHOP_PRODUCTS: readonly ShopProduct[] = [
  {
    id: 'hw',
    name: 'Tropical Groove Halloween',
    whatsappItem: 'Halloween',
    image: '/shop/HW_TEE_UV.webp',
    imageAlt: 'Tropical Groove Halloween T-Shirt, UV embroidery',
    highlighted: true,
    stockNote: 'lastRun',
    stock: stockFrom(SHOP_STOCK.hw),
  },
  {
    id: 'pg',
    name: 'Psy Groove',
    whatsappItem: 'Psy Groove',
    image: '/shop/PG_TEE_UV.webp',
    imageAlt: 'Psy Groove T-Shirt, UV embroidery',
    highlighted: false,
    stockNote: 'madeToOrder',
    stock: stockFrom(SHOP_STOCK.pg),
  },
];

export function liveSizes(product: ShopProduct): ShopSizeStock[] {
  return product.stock.filter((size) => size.count > 0);
}

export function stockCount(product: ShopProduct): number {
  return liveSizes(product).reduce((sum, size) => sum + size.count, 0);
}

export function totalTeeCount(): number {
  return SHOP_PRODUCTS.reduce((sum, product) => sum + stockCount(product), 0);
}

/** Same meter scale as the shop prototype: full bar at 10 pieces, never empty. */
export function stockMeterPercent(count: number): number {
  return Math.max(8, Math.min(100, (count / 10) * 100));
}

export function whatsappReserveUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(message)}`;
}

export function sizeLabel(code: ShopSizeCode, language: 'en' | 'pt'): string {
  return language === 'en' ? EN_SIZE[code] : code;
}
