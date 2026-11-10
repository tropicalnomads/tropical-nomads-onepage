import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { readSessionSub, sessionCookieName } from '../../../../src/account/session';
import { ShopReview } from '../../../../src/components/ShopReview';
import { loadShopImages } from '../../../../src/shop/load-images';
import { loadShopProducts } from '../../../../src/shop/load-products';

export default async function ShopReviewPage() {
  const jar = await cookies();
  if (!readSessionSub(jar.get(sessionCookieName)?.value)) {
    redirect('/account/sign-in');
  }
  const products = await loadShopProducts();
  return (
    <main>
      <ShopReview imageSources={loadShopImages(products)} />
    </main>
  );
}
