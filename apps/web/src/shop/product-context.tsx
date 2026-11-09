'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { ShopProduct } from '../../../one-pager/src/lib/shop.ts';
import { shopProducts } from './order.ts';

const ShopProductsContext = createContext<readonly ShopProduct[] | undefined>(undefined);

export function ShopProductsProvider({ products, children }: { products: readonly ShopProduct[]; children: ReactNode }) {
  return <ShopProductsContext.Provider value={products}>{children}</ShopProductsContext.Provider>;
}

export function useShopProducts(): readonly ShopProduct[] {
  return useContext(ShopProductsContext) ?? shopProducts();
}
