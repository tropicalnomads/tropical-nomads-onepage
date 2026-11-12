import { adminActor, loadAdminEventList } from '../admin/actions';
import { loadAdminShopProducts } from '../admin/shop-actions';
import type { AdminTab } from './AdminFrame';
import { AdminDenied } from './AdminEventList';
import { AdminHub } from './AdminHub';

export async function AdminHubPage({ tab }: { tab: AdminTab }) {
  const actor = await adminActor();
  if (!actor) {
    return <AdminDenied />;
  }
  const [parties, products] = await Promise.all([loadAdminEventList(), loadAdminShopProducts()]);
  return <AdminHub initialTab={tab} parties={parties} products={products} />;
}
