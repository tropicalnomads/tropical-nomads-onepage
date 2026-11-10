import { adminActor } from '../../../src/admin/actions';
import { loadAdminShopOrders, loadAdminShopProducts } from '../../../src/admin/shop-actions';
import { AdminDenied } from '../../../src/components/AdminEventList';
import { AdminShopOrders } from '../../../src/components/AdminShopOrders';

export const dynamic = 'force-dynamic';

export default async function AdminShopOrdersPage() {
  const actor = await adminActor();
  if (!actor) {
    return <AdminDenied />;
  }
  const [orders, products] = await Promise.all([loadAdminShopOrders(), loadAdminShopProducts()]);
  return (
    <main className="px-5 py-8 md:px-8">
      <AdminShopOrders orders={orders} products={products} />
    </main>
  );
}
