'use client';

import { useEffect, useRef, useState } from 'react';
import {
  addShopLine,
  emptyShopAddress,
  parseShopCart,
  removeShopLine,
  setShopLineQuantity,
  shopCartStorageKey,
  shopPieceCount,
  type StoredShopCart,
} from './cart.ts';
import type { ShopAddress, ShopLine } from './order.ts';
import { useShopCatalog } from './product-context';

const cartEvent = 'tn-shop-cart';

const emptyCart: StoredShopCart = { lines: [], address: emptyShopAddress };

function readCart(catalog: ReturnType<typeof useShopCatalog>): StoredShopCart {
  try {
    return parseShopCart(window.localStorage.getItem(shopCartStorageKey), catalog);
  } catch {
    return emptyCart;
  }
}

function writeCart(cart: StoredShopCart): void {
  try {
    window.localStorage.setItem(shopCartStorageKey, JSON.stringify(cart));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(cartEvent));
}

export function useShopCart() {
  const catalog = useShopCatalog();
  const catalogRef = useRef(catalog);
  catalogRef.current = catalog;
  const [cart, setCart] = useState<StoredShopCart>(emptyCart);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = (): void => {
      const raw = window.localStorage.getItem(shopCartStorageKey);
      const next = parseShopCart(raw, catalog);
      const serialized = JSON.stringify(next);
      if (catalog && raw !== serialized) {
        try {
          window.localStorage.setItem(shopCartStorageKey, serialized);
        } catch {
          setCart(next);
          setReady(true);
          return;
        }
        window.dispatchEvent(new Event(cartEvent));
      }
      setCart(next);
      setReady(true);
    };
    sync();
    window.addEventListener(cartEvent, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(cartEvent, sync);
      window.removeEventListener('storage', sync);
    };
  }, [catalog]);

  const commit = (change: (current: StoredShopCart) => StoredShopCart): void => {
    const next = change(readCart(catalogRef.current));
    writeCart(next);
    setCart(next);
  };

  return {
    ready,
    lines: cart.lines,
    address: cart.address,
    count: shopPieceCount(cart.lines),
    add(line: ShopLine): void {
      commit((current) => ({ ...current, lines: addShopLine(current.lines, line, catalogRef.current ?? []) }));
    },
    setQuantity(productId: ShopLine['productId'], size: ShopLine['size'], quantity: number): void {
      commit((current) => ({ ...current, lines: setShopLineQuantity(current.lines, productId, size, quantity, catalogRef.current ?? []) }));
    },
    remove(productId: ShopLine['productId'], size: ShopLine['size']): void {
      commit((current) => ({ ...current, lines: removeShopLine(current.lines, productId, size) }));
    },
    setAddress(address: ShopAddress): void {
      commit((current) => ({ ...current, address }));
    },
    clearLines(): void {
      commit((current) => ({ ...current, lines: [] }));
    },
  };
}
