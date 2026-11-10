import { ShopReview } from '../../../../src/components/ShopReview';
import { loadShopImages } from '../../../../src/shop/load-images';
import { loadShopProducts } from '../../../../src/shop/load-products';

export default async function ShopReviewPage() {
  const products = await loadShopProducts();
  return (
    <main>
      <ShopReview imageSources={loadShopImages(products)} />
    </main>
  );
}
