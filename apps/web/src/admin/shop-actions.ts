'use server';

import { apiOrigin } from '../api-origin.ts';
import { callPrivate } from '../remote-store.ts';
import { adminActor } from './actions.ts';
import { shopSizeCodes, type ShopOrderRow } from './shop-values.ts';

export type ShopProductNotice = { notice: 'saved'; id: string } | { notice: 'denied' | 'invalid' };

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

export async function saveShopProductAction(formData: FormData): Promise<ShopProductNotice> {
  const actor = await adminActor();
  if (!actor || !apiOrigin()) {
    return { notice: 'denied' };
  }
  const stock: Record<(typeof shopSizeCodes)[number], number> = { P: 0, M: 0, G: 0, GG: 0, '2XL': 0 };
  for (const size of shopSizeCodes) {
    const raw = field(formData, `stock-${size}`);
    if (!/^\d{1,3}$/.test(raw)) {
      return { notice: 'invalid' };
    }
    stock[size] = Number(raw);
  }
  const file = formData.get('image');
  let imageBase64: string | undefined;
  if (file instanceof File && file.size > 0) {
    if (file.size > 5_000_000) {
      return { notice: 'invalid' };
    }
    imageBase64 = Buffer.from(await file.arrayBuffer()).toString('base64');
  }
  const id = field(formData, 'id');
  try {
    const saved = await callPrivate<{ id?: unknown }>('save-shop-product', {
      ...(id !== '' ? { id } : {}),
      name: field(formData, 'name'),
      descriptionEn: field(formData, 'descriptionEn'),
      descriptionPt: field(formData, 'descriptionPt'),
      amount: field(formData, 'amount'),
      stock,
      ...(imageBase64 ? { imageBase64 } : {}),
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

export async function loadAdminShopOrders(): Promise<ShopOrderRow[]> {
  const actor = await adminActor();
  if (!actor || !apiOrigin()) {
    return [];
  }
  return callPrivate<ShopOrderRow[]>('admin-shop-orders');
}
