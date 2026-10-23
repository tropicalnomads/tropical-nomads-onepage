/** Edit counts here. 0 hides that size. */
export const MERCH_STOCK = {
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
export const MERCH_PRICE_EUR = 50;
export const MERCH_PICKUP = 'The Sound House · Dublin';

export type MerchSizeCode = 'P' | 'M' | 'G' | 'GG' | '2XL';

export const EN_SIZE: Record<MerchSizeCode, string> = {
  P: 'S',
  M: 'M',
  G: 'L',
  GG: 'XL',
  '2XL': '2XL',
};

export interface MerchSizeStock {
  code: MerchSizeCode;
  count: number;
}

export interface MerchProduct {
  id: 'hw' | 'pg';
  name: string;
  whatsappItem: string;
  image: string;
  imageAlt: string;
  highlighted: boolean;
  stockNote: 'lastRun' | 'madeToOrder';
  stock: MerchSizeStock[];
}

function stockFrom(
  rows: readonly (readonly [MerchSizeCode, number])[],
): MerchSizeStock[] {
  return rows.map(([code, count]) => ({ code, count }));
}

export const MERCH_PRODUCTS: readonly MerchProduct[] = [
  {
    id: 'hw',
    name: 'Tropical Groove Halloween',
    whatsappItem: 'Halloween',
    image: '/merch/HW_TEE_UV.webp',
    imageAlt: 'Tropical Groove Halloween T-Shirt, UV embroidery',
    highlighted: true,
    stockNote: 'lastRun',
    stock: stockFrom(MERCH_STOCK.hw),
  },
  {
    id: 'pg',
    name: 'Psy Groove',
    whatsappItem: 'Psy Groove',
    image: '/merch/PG_TEE_UV.webp',
    imageAlt: 'Psy Groove T-Shirt, UV embroidery',
    highlighted: false,
    stockNote: 'madeToOrder',
    stock: stockFrom(MERCH_STOCK.pg),
  },
];

export function liveSizes(product: MerchProduct): MerchSizeStock[] {
  return product.stock.filter((size) => size.count > 0);
}

export function stockCount(product: MerchProduct): number {
  return liveSizes(product).reduce((sum, size) => sum + size.count, 0);
}

export function totalTeeCount(): number {
  return MERCH_PRODUCTS.reduce((sum, product) => sum + stockCount(product), 0);
}

/** Same meter scale as the merch prototype: full bar at 10 pieces, never empty. */
export function stockMeterPercent(count: number): number {
  return Math.max(8, Math.min(100, (count / 10) * 100));
}

export function whatsappReserveUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(message)}`;
}

export function sizeLabel(code: MerchSizeCode, language: 'en' | 'pt'): string {
  return language === 'en' ? EN_SIZE[code] : code;
}
