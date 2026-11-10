import { databaseSettings } from './database.ts';
import { readStoredProducts } from './sql-store.ts';

export async function loadProductCatalog(): Promise<unknown[]> {
  if (!databaseSettings()) {
    throw new Error('products are unavailable');
  }
  return readStoredProducts();
}
