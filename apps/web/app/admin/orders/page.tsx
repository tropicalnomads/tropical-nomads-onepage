import { adminActor } from '../../../src/admin/actions';
import { AdminOrders } from '../../../src/components/AdminOrders';
import { AdminDenied } from '../../../src/components/AdminEventList';
import { loadAllOrders } from '../../../src/orders/load';
import { adminOrderCards } from '../../../src/orders/present';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function AdminOrdersPage() {
  const actor = await adminActor();
  if (!actor) {
    return <AdminDenied />;
  }
  const orders = adminOrderCards(await loadAllOrders());
  return <AdminOrders orders={orders} />;
}
