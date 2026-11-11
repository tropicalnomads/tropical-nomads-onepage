import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { readSessionSub, sessionCookieName } from '../../../../src/account/session';
import { currentAccounts } from '../../../../src/remote-store';
import { ShopReview } from '../../../../src/components/ShopReview';
import { loadShopImages } from '../../../../src/shop/load-images';
import { loadShopProducts } from '../../../../src/shop/load-products';

export default async function ShopReviewPage() {
  const jar = await cookies();
  const sub = readSessionSub(jar.get(sessionCookieName)?.value);
  if (!sub) {
    redirect('/account/sign-in');
  }
  const accounts = await currentAccounts();
  if (!accounts.profiles.some((item) => item.sub === sub)) {
    redirect('/account/profile');
  }
  const products = await loadShopProducts();
  return (
    <main>
      <ShopReview imageSources={loadShopImages(products)} />
    </main>
  );
}
