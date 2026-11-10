'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { ShopCatalogProduct } from './catalog.ts';

const ShopProductsContext = createContext<readonly ShopCatalogProduct[] | undefined>(undefined);

export function ShopProductsProvider({ products, children }: { products: readonly ShopCatalogProduct[]; children: ReactNode }) {
  return <ShopProductsContext.Provider value={products}>{children}</ShopProductsContext.Provider>;
}

export function useShopProducts(): readonly ShopCatalogProduct[] {
  return useContext(ShopProductsContext) ?? [];
}

export function useShopCatalog(): readonly ShopCatalogProduct[] | undefined {
  return useContext(ShopProductsContext);
}
