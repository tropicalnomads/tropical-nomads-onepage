import { adminActor } from '../../../src/admin/actions';
import { loadAdminShopOrders } from '../../../src/admin/shop-actions';
import { AdminDenied } from '../../../src/components/AdminEventList';
import { AdminShopOrders } from '../../../src/components/AdminShopOrders';

export const dynamic = 'force-dynamic';

export default async function AdminShopOrdersPage() {
  const actor = await adminActor();
  if (!actor) {
    return <AdminDenied />;
  }
  return (
    <main className="px-5 py-8 md:px-8">
      <AdminShopOrders orders={await loadAdminShopOrders()} />
    </main>
  );
}
