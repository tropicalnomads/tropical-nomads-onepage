'use server';

import { revalidatePath } from 'next/cache';
import { markOrderPaid } from 'tropical-nomads-api/orders';
import { apiOrigin } from '../api-origin.ts';
import { callPrivate } from '../remote-store.ts';
import { adminActor } from './actions.ts';

export type MarkPaidResult = { ok: true } | { ok: false; reason: 'sold-out' | 'denied' | 'unavailable' };

function failed(error: unknown): MarkPaidResult {
  const message = error instanceof Error ? error.message : '';
  if (message === 'sold out') {
    return { ok: false, reason: 'sold-out' };
  }
  if (message === 'request was not accepted') {
    return { ok: false, reason: 'denied' };
  }
  return { ok: false, reason: 'unavailable' };
}

export async function markOrderPaidAction(orderId: string): Promise<MarkPaidResult> {
  const actor = await adminActor();
  if (!actor) {
    return { ok: false, reason: 'denied' };
  }
  try {
    if (apiOrigin()) {
      await callPrivate('mark-order-paid', { orderId });
    } else {
      await markOrderPaid(actor.actorId, orderId);
    }
  } catch (error) {
    return failed(error);
  }
  revalidatePath('/admin/orders');
  revalidatePath('/my-orders');
  return { ok: true };
}
