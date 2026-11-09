'use client';

import { useEffect, useState } from 'react';
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

const cartEvent = 'tn-shop-cart';

const emptyCart: StoredShopCart = { lines: [], address: emptyShopAddress };

function readCart(): StoredShopCart {
  try {
    return parseShopCart(window.localStorage.getItem(shopCartStorageKey));
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
  const [cart, setCart] = useState<StoredShopCart>(emptyCart);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = (): void => {
      setCart(readCart());
    };
    sync();
    setReady(true);
    window.addEventListener(cartEvent, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(cartEvent, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const commit = (change: (current: StoredShopCart) => StoredShopCart): void => {
    const next = change(readCart());
    writeCart(next);
    setCart(next);
  };

  return {
    ready,
    lines: cart.lines,
    address: cart.address,
    count: shopPieceCount(cart.lines),
    add(line: ShopLine): void {
      commit((current) => ({ ...current, lines: addShopLine(current.lines, line) }));
    },
    setQuantity(productId: ShopLine['productId'], size: ShopLine['size'], quantity: number): void {
      commit((current) => ({ ...current, lines: setShopLineQuantity(current.lines, productId, size, quantity) }));
    },
    remove(productId: ShopLine['productId'], size: ShopLine['size']): void {
      commit((current) => ({ ...current, lines: removeShopLine(current.lines, productId, size) }));
    },
    setAddress(address: ShopAddress): void {
      commit((current) => ({ ...current, address }));
    },
  };
}
