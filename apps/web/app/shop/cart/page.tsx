import { ShopCart } from '../../../src/components/ShopCart';
import { loadShopImages } from '../../../src/shop/load-images';
import { loadShopProducts } from '../../../src/shop/load-products';

export default async function ShopCartPage() {
  const products = await loadShopProducts();
  return (
    <main>
      <ShopCart imageSources={loadShopImages(products)} />
    </main>
  );
}
