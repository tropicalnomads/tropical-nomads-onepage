import { SHOP_PRICE_EUR, SHOP_PRODUCTS, liveSizes, sizeLabel, type ShopSizeCode } from '../../../one-pager/src/lib/shop.ts';

export const shopWhatsappE164 = '4917648996011';
export const shopPriceEur = SHOP_PRICE_EUR;

export interface ShopLine {
  productId: 'hw' | 'pg';
  size: ShopSizeCode;
  quantity: number;
}

export interface ShopAddress {
  name: string;
  line1: string;
  city: string;
  postalCode: string;
  country: string;
}

const fieldLimit = 80;

function clean(value: string): string {
  return value.replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, fieldLimit);
}

function addressLines(address: ShopAddress): string[] | undefined {
  const lines = [clean(address.name), clean(address.line1), clean(address.city), clean(address.postalCode), clean(address.country)];
  if (lines.some((line) => line === '')) {
    return undefined;
  }
  return lines;
}

function sizeStock(productId: ShopLine['productId'], size: ShopSizeCode): number {
  const product = SHOP_PRODUCTS.find((item) => item.id === productId);
  if (!product) {
    return 0;
  }
  return liveSizes(product).find((item) => item.code === size)?.count ?? 0;
}

export function shopProducts(): typeof SHOP_PRODUCTS {
  return SHOP_PRODUCTS;
}

export function linePrice(quantity: number): number {
  return quantity * shopPriceEur;
}

export function shopTotal(lines: readonly ShopLine[]): number {
  return lines.reduce((sum, line) => sum + linePrice(line.quantity), 0);
}

export function shopOrderMessage(lines: readonly ShopLine[], address: ShopAddress, language: 'en' | 'pt'): string | undefined {
  const delivery = addressLines(address);
  if (!delivery || lines.length === 0) {
    return undefined;
  }
  const rows: string[] = [];
  for (const line of lines) {
    const product = SHOP_PRODUCTS.find((item) => item.id === line.productId);
    const stock = sizeStock(line.productId, line.size);
    if (!product || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > stock) {
      return undefined;
    }
    rows.push(product.name);
    rows.push(`${line.quantity} × ${sizeLabel(line.size, language)} · €${linePrice(line.quantity)}`);
    rows.push('');
  }
  const heading = language === 'pt' ? 'Pedido da loja Tropical Nomads' : 'Tropical Nomads shop';
  const deliveryLabel = language === 'pt' ? 'Entrega' : 'Delivery';
  const totalLabel = language === 'pt' ? 'Total' : 'Total';
  return [heading, '', ...rows, deliveryLabel, ...delivery, '', `${totalLabel} €${shopTotal(lines)}`].join('\n');
}

export function shopWhatsappUrl(message: string): string {
  return `https://wa.me/${shopWhatsappE164}?text=${encodeURIComponent(message)}`;
}
