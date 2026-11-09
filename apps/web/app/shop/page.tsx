import { ShopCatalog } from '../../src/components/ShopCatalog';
import { loadShopImages } from '../../src/shop/load-images';

export default function ShopPage() {
  return (
    <main>
      <ShopCatalog imageSources={loadShopImages()} />
    </main>
  );
}
