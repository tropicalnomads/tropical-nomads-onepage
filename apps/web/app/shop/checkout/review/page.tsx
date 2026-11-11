import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { profileSetupHref, signInHref } from '../../../../src/account/return-path';
import { readSessionSub, sessionCookieName } from '../../../../src/account/session';
import { currentAccounts } from '../../../../src/remote-store';
import { ShopReview } from '../../../../src/components/ShopReview';
import { loadShopImages } from '../../../../src/shop/load-images';
import { loadShopProducts } from '../../../../src/shop/load-products';

export default async function ShopReviewPage() {
  const jar = await cookies();
  const sub = readSessionSub(jar.get(sessionCookieName)?.value);
  if (!sub) {
    redirect(signInHref('/shop/checkout/review'));
  }
  const accounts = await currentAccounts();
  if (!accounts.profiles.some((item) => item.sub === sub)) {
    redirect(profileSetupHref('/shop/checkout/review'));
  }
  const products = await loadShopProducts();
  return (
    <main>
      <ShopReview imageSources={loadShopImages(products)} />
    </main>
  );
}
