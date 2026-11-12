import { listAdminOrders, listOwnOrders, type AdminOrderView, type OwnOrderView } from 'tropical-nomads-api/orders';
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
  return listAdminOrders(actor.actorId);
}
