import { adminActor } from '../../../../src/admin/actions';
import { loadAdminShopProduct } from '../../../../src/admin/shop-actions';
import { shopProductValues } from '../../../../src/admin/shop-values';
import { AdminDenied } from '../../../../src/components/AdminEventList';
import { AdminShopForm } from '../../../../src/components/AdminShopForm';
import { ShopMissing } from '../../../../src/components/ShopCatalog';
import { productImageSrc } from '../../../../src/shop/load-images';

export const dynamic = 'force-dynamic';

export default async function EditShopProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const actor = await adminActor();
  if (!actor) {
    return <AdminDenied />;
  }
  const { productId } = await params;
  const product = await loadAdminShopProduct(productId);
  if (!product) {
    return (
      <main>
        <ShopMissing />
      </main>
    );
  }
  return (
    <main className="px-5 py-8 md:px-8">
      <AdminShopForm values={shopProductValues(product, productImageSrc(product.image))} />
    </main>
  );
}
