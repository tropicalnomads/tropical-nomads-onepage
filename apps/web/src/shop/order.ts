import { sizeLabel, type ShopSizeCode } from '../../../one-pager/src/lib/shop.ts';
import { shopAmountLabel, sizeStock, type ShopCatalogProduct } from './catalog.ts';

export const shopWhatsappE164 = '4917648996011';

export interface ShopLine {
  productId: string;
  size: ShopSizeCode;
  quantity: number;
}

export interface ShopAddress {
  name: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

const fieldLimit = 80;

function clean(value: string): string {
  return value.replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, fieldLimit);
}

function addressLines(address: ShopAddress): string[] | undefined {
  const required = [clean(address.name), clean(address.line1), clean(address.city), clean(address.postalCode), clean(address.country)];
  if (required.some((line) => line === '')) {
    return undefined;
  }
  return [required[0], required[1], clean(address.line2), required[2], clean(address.region), required[3], required[4]].filter(
    (line) => line !== '',
  );
}

export function linePrice(quantity: number, amount: number): number {
  return quantity * amount;
}

export function shopTotal(lines: readonly ShopLine[], products: readonly Pick<ShopCatalogProduct, 'id' | 'amount'>[]): number {
  return lines.reduce((sum, line) => sum + linePrice(line.quantity, products.find((product) => product.id === line.productId)?.amount ?? 0), 0);
}

export function shopTotalLabel(lines: readonly ShopLine[], products: readonly Pick<ShopCatalogProduct, 'id' | 'amount' | 'currency'>[]): string {
  const currencies = lines.flatMap((line) => {
    const currency = products.find((product) => product.id === line.productId)?.currency;
    return currency === undefined ? [] : [currency];
  });
  const shared = currencies[0];
  const currency = shared !== undefined && currencies.every((item) => item === shared) ? shared : 'EUR';
  return shopAmountLabel(shopTotal(lines, products), currency);
}

export function shopAddressComplete(address: ShopAddress): boolean {
  return addressLines(address) !== undefined;
}

export function shopOrderMessage(
  lines: readonly ShopLine[],
  address: ShopAddress,
  language: 'en' | 'pt',
  products: readonly Pick<ShopCatalogProduct, 'id' | 'name' | 'amount' | 'currency' | 'stock'>[],
  orderId?: string,
): string | undefined {
  const delivery = addressLines(address);
  if (!delivery || lines.length === 0) {
    return undefined;
  }
  const rows: string[] = [];
  for (const line of lines) {
    const product = products.find((item) => item.id === line.productId);
    const stock = product ? sizeStock(products, line.productId, line.size) : 0;
    if (!product || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > stock) {
      return undefined;
    }
    rows.push(product.name);
    rows.push(`${line.quantity} × ${sizeLabel(line.size, language)} · ${shopAmountLabel(linePrice(line.quantity, product.amount), product.currency)}`);
    rows.push('');
  }
  const heading = language === 'pt' ? 'Pedido da loja Tropical Nomads' : 'Tropical Nomads shop';
  const deliveryLabel = language === 'pt' ? 'Entrega' : 'Delivery';
  const totalLabel = language === 'pt' ? 'Total' : 'Total';
  const orderLine = orderId !== undefined && /^order-[a-f0-9]{8,}$/.test(orderId) ? (language === 'pt' ? `Pedido ${orderId}` : `Order ${orderId}`) : undefined;
  return [heading, '', ...(orderLine ? [orderLine, ''] : []), ...rows, deliveryLabel, ...delivery, '', `${totalLabel} ${shopTotalLabel(lines, products)}`].join('\n');
}

export function shopWhatsappUrl(message: string): string {
  return `https://wa.me/${shopWhatsappE164}?text=${encodeURIComponent(message)}`;
}

export const shopConfirmationKey = 'tn:shop-confirmation:v1';

export function shopConfirmationRecord(orderId: string, message: string): { orderId: string; message: string } | undefined {
  if (!/^order-[a-f0-9]{8,}$/.test(orderId) || message.trim() === '' || message.length > 4000) {
    return undefined;
  }
  return { orderId, message };
}

export function readShopConfirmation(raw: string | null): { orderId: string; message: string } | undefined {
  if (!raw) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return undefined;
    }
    const orderId = 'orderId' in parsed ? parsed.orderId : undefined;
    const message = 'message' in parsed ? parsed.message : undefined;
    if (typeof orderId !== 'string' || typeof message !== 'string') {
      return undefined;
    }
    return shopConfirmationRecord(orderId, message);
  } catch {
    return undefined;
  }
}
