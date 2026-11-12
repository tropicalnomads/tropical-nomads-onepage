import { databaseSettings } from './database.ts';
import { reconcileUnpaidShopStock } from './shop-stock.ts';
import { readStoredProducts } from './sql-store.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function publicShopProducts(products: readonly unknown[]): unknown[] {
  return products.filter((product) => !isRecord(product) || product.hidden !== true);
}

export async function loadProductCatalog(): Promise<unknown[]> {
  if (!databaseSettings()) {
    throw new Error('products are unavailable');
  }
  await reconcileUnpaidShopStock();
  return publicShopProducts(await readStoredProducts());
}
