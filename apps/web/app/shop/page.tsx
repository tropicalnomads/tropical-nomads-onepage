import { adminActor } from '../../src/admin/actions';
import { ShopCatalog } from '../../src/components/ShopCatalog';
import { loadShopImages } from '../../src/shop/load-images';
import { loadShopProducts } from '../../src/shop/load-products';

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
  const products = await loadShopProducts();
  const admin = (await adminActor()) !== undefined;
  return (
    <main>
      <ShopCatalog imageSources={loadShopImages(products)} admin={admin} />
    </main>
  );
}
