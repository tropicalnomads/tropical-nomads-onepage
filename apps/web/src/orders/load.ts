import type { AdminOrderView, OwnOrderView } from 'tropical-nomads-api/orders';
import { adminActor } from '../admin/actions.ts';
import { apiOrigin } from '../api-origin.ts';
import { callPrivate } from '../remote-store.ts';

export async function loadOwnOrders(sub: string | undefined): Promise<OwnOrderView[]> {
  if (!sub) {
    return [];
  }
  if (apiOrigin()) {
    return callPrivate<OwnOrderView[]>('own-orders');
  }
  const { listOwnOrders } = await import('tropical-nomads-api/orders');
  return listOwnOrders(sub);
}

export async function loadAllOrders(): Promise<AdminOrderView[]> {
  const actor = await adminActor();
  if (!actor) {
    return [];
  }
  if (apiOrigin()) {
    return callPrivate<AdminOrderView[]>('admin-orders');
  }
  const { listAdminOrders } = await import('tropical-nomads-api/orders');
  return listAdminOrders(actor.actorId);
}
