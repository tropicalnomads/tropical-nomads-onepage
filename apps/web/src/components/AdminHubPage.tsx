import { adminActor, loadAdminEventList } from '../admin/actions';
import { loadAdminShopOrders, loadAdminShopProducts } from '../admin/shop-actions';
import type { AdminTab } from './AdminFrame';
import { AdminDenied } from './AdminEventList';
import { AdminHub } from './AdminHub';

export async function AdminHubPage({ tab }: { tab: AdminTab }) {
  const actor = await adminActor();
  if (!actor) {
    return <AdminDenied />;
  }
  const [parties, orders, products] = await Promise.all([loadAdminEventList(), loadAdminShopOrders(), loadAdminShopProducts()]);
  return <AdminHub initialTab={tab} parties={parties} orders={orders} products={products} />;
}
