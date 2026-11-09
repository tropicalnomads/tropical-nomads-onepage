import { ShopCart } from '../../../src/components/ShopCart';
import { loadShopImages } from '../../../src/shop/load-images';

export default function ShopCartPage() {
  return (
    <main>
      <ShopCart imageSources={loadShopImages()} />
    </main>
  );
}
