import { ShopMissing } from '../../../src/components/ShopCatalog';
import { ShopProduct } from '../../../src/components/ShopProduct';
import { loadShopProducts } from '../../../src/shop/load-products';
import { productImageSrc } from '../../../src/shop/load-images';

export const dynamic = 'force-dynamic';

export default async function ShopProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const product = (await loadShopProducts()).find((item) => item.id === productId);
  if (!product) {
    return (
      <main>
        <ShopMissing />
      </main>
    );
  }
  return (
    <main>
      <ShopProduct productId={product.id} image={productImageSrc(product.image)} />
    </main>
  );
}
