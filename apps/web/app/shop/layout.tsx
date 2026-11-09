import type { ReactNode } from 'react';
import { ShopProductsProvider } from '../../src/shop/product-context';
import { loadShopProducts } from '../../src/shop/load-products';

export default async function ShopLayout({ children }: { children: ReactNode }) {
  const products = await loadShopProducts();
  return <ShopProductsProvider products={products}>{children}</ShopProductsProvider>;
}
