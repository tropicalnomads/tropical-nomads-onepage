import type { Metadata } from 'next';
import { adminActor } from '../../src/admin/actions';
import { ShopCatalog } from '../../src/components/ShopCatalog';
import { publicMetadata } from '../../src/seo/metadata';
import { loadShopImages } from '../../src/shop/load-images';
import { loadShopProducts } from '../../src/shop/load-products';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string | string[] }> }): Promise<Metadata> {
  const params = await searchParams;
  return publicMetadata('/shop', params.lang);
}

export default async function ShopPage() {
  const products = await loadShopProducts();
  const admin = (await adminActor()) !== undefined;
  return (
    <main>
      <ShopCatalog imageSources={loadShopImages(products)} admin={admin} />
    </main>
  );
}
