import { ShopReview } from '../../../../src/components/ShopReview';
import { loadShopImages } from '../../../../src/shop/load-images';

export default function ShopReviewPage() {
  return (
    <main>
      <ShopReview imageSources={loadShopImages()} />
    </main>
  );
}
