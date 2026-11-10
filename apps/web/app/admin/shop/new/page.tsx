import { adminActor } from '../../../../src/admin/actions';
import { emptyShopProduct } from '../../../../src/admin/shop-values';
import { AdminDenied } from '../../../../src/components/AdminEventList';
import { AdminShopForm } from '../../../../src/components/AdminShopForm';

export const dynamic = 'force-dynamic';

export default async function NewShopProductPage() {
  const actor = await adminActor();
  if (!actor) {
    return <AdminDenied />;
  }
  return (
    <main className="px-5 py-8 md:px-8">
      <AdminShopForm values={emptyShopProduct} />
    </main>
  );
}
