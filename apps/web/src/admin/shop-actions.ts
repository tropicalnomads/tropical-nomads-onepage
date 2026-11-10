'use server';

import { apiOrigin } from '../api-origin.ts';
import { callPrivate } from '../remote-store.ts';
import { adminActor } from './actions.ts';
import { shopProductSubmission } from './shop-submission.ts';
import type { ShopCatalogProduct } from '../shop/catalog.ts';
import { parseAdminProductCatalog } from '../shop/load-products.ts';
import type { ShopOrderRow } from './shop-values.ts';

export type ShopProductNotice = { notice: 'saved'; id: string } | { notice: 'denied' | 'invalid' };
export type ShopDeleteNotice = { notice: 'deleted' } | { notice: 'denied' | 'invalid' };

const productIdPattern = /^[A-Za-z0-9_-]{1,40}$/;

export async function saveShopProductAction(formData: FormData): Promise<ShopProductNotice> {
  const actor = await adminActor();
  if (!actor || !apiOrigin()) {
    return { notice: 'denied' };
  }
  const submission = await shopProductSubmission(formData);
  if (!submission) {
    return { notice: 'invalid' };
  }
  try {
    const saved = await callPrivate<{ id?: unknown }>('save-shop-product', {
      ...(submission.id ? { id: submission.id } : {}),
      name: submission.name,
      description: submission.description,
      amount: submission.amount,
      stock: submission.stock,
      imageAction: submission.imageAction,
      ...(submission.hidden === undefined ? {} : { hidden: submission.hidden }),
      ...(submission.imageBase64 ? { imageBase64: submission.imageBase64 } : {}),
    });
    if (typeof saved.id !== 'string' || saved.id.trim() === '') {
      return { notice: 'invalid' };
    }
    return { notice: 'saved', id: saved.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'request was not accepted') {
      return { notice: 'denied' };
    }
    return { notice: 'invalid' };
  }
}

export async function loadAdminShopProducts(): Promise<ShopCatalogProduct[]> {
  const actor = await adminActor();
  if (!actor || !apiOrigin()) {
    return [];
  }
  return parseAdminProductCatalog(await callPrivate<unknown>('admin-shop-products'));
}

export async function loadAdminShopProduct(productId: string): Promise<ShopCatalogProduct | undefined> {
  const actor = await adminActor();
  if (!actor || !apiOrigin() || !productIdPattern.test(productId)) {
    return undefined;
  }
  const product = await callPrivate<unknown>('admin-shop-product', { id: productId });
  if (product == null) {
    return undefined;
  }
  return parseAdminProductCatalog([product])[0];
}

export async function deleteShopProductAction(productId: string): Promise<ShopDeleteNotice> {
  const actor = await adminActor();
  if (!actor || !apiOrigin()) {
    return { notice: 'denied' };
  }
  if (!productIdPattern.test(productId)) {
    return { notice: 'invalid' };
  }
  try {
    const deleted = await callPrivate<{ id?: unknown }>('delete-shop-product', { id: productId });
    if (deleted.id !== productId) {
      return { notice: 'invalid' };
    }
    return { notice: 'deleted' };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'request was not accepted') {
      return { notice: 'denied' };
    }
    return { notice: 'invalid' };
  }
}

export async function loadAdminShopOrders(): Promise<ShopOrderRow[]> {
  const actor = await adminActor();
  if (!actor || !apiOrigin()) {
    return [];
  }
  return callPrivate<ShopOrderRow[]>('admin-shop-orders');
}
