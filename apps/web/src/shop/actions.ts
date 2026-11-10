'use server';

import { cookies } from 'next/headers';
import { saveDefaultBillingAddress, updateAccounts } from 'tropical-nomads-api/accounts';
import { readSessionSub, sessionCookieName } from '../account/session';
import { apiOrigin } from '../api-origin.ts';
import { callPrivate } from '../remote-store.ts';

export type SaveDeliveryResult = 'saved' | 'not-signed-in' | 'invalid';

export type PlaceShopOrderResult = { ok: true; orderId: string } | { ok: false; reason: 'sold-out' | 'unavailable' };

const limit = 80;

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim().slice(0, limit) : '';
}

export async function saveDeliveryAddressAction(formData: FormData): Promise<SaveDeliveryResult> {
  const jar = await cookies();
  const sub = readSessionSub(jar.get(sessionCookieName)?.value);
  if (!sub) {
    return 'not-signed-in';
  }
  const address = {
    recipientName: field(formData, 'name'),
    line1: field(formData, 'line1'),
    line2: field(formData, 'line2'),
    city: field(formData, 'city'),
    region: field(formData, 'region'),
    postalCode: field(formData, 'postalCode'),
    country: field(formData, 'country'),
  };
  if (!address.recipientName || !address.line1 || !address.city || !address.postalCode || !address.country) {
    return 'invalid';
  }
  try {
    if (apiOrigin()) {
      await callPrivate('save-billing', {
        sub,
        address: {
          ...address,
          region: address.region || address.city,
        },
      });
      return 'saved';
    }
    await updateAccounts((current) =>
      saveDefaultBillingAddress(
        current,
        sub,
        {
          ...address,
          // The shared address schema requires a region. Some postal systems do not use one.
          region: address.region || address.city,
        },
        new Date().toISOString(),
      ),
    );
  } catch {
    return 'invalid';
  }
  return 'saved';
}

export async function placeShopOrderAction(input: unknown): Promise<PlaceShopOrderResult> {
  if (!apiOrigin()) {
    return { ok: false, reason: 'unavailable' };
  }
  try {
    const result = await callPrivate<{ orderId?: unknown }>('place-shop-order', input);
    if (typeof result.orderId !== 'string' || result.orderId.trim() === '') {
      return { ok: false, reason: 'unavailable' };
    }
    return { ok: true, orderId: result.orderId };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'sold out') {
      return { ok: false, reason: 'sold-out' };
    }
    return { ok: false, reason: 'unavailable' };
  }
}
