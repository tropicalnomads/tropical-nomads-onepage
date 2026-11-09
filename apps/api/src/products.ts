import { SHOP_PICKUP, SHOP_PRICE_EUR, SHOP_PRODUCTS } from '../../one-pager/src/lib/shop.ts';
import { databaseSettings } from './database.ts';
import { readStoredProducts } from './sql-store.ts';

function constantProducts(): unknown[] {
  return SHOP_PRODUCTS.map((product) => ({
    id: product.id,
    name: product.name,
    whatsappItem: product.whatsappItem,
    image: product.image,
    imageAlt: product.imageAlt,
    highlighted: product.highlighted,
    stockNote: product.stockNote,
    amount: SHOP_PRICE_EUR,
    currency: 'EUR',
    pickup: SHOP_PICKUP,
    stock: product.stock.map((size) => ({ code: size.code, count: size.count })),
  }));
}

export async function loadProductCatalog(): Promise<unknown[]> {
  if (!databaseSettings()) {
    return constantProducts();
  }
  return readStoredProducts();
}
