import { ShopMissing } from '../../../src/components/ShopCatalog';
import { ShopProduct } from '../../../src/components/ShopProduct';
import { shirtSrc } from '../../../src/events/assets';
import { loadShopProducts } from '../../../src/shop/load-products';

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
      <ShopProduct productId={product.id} image={shirtSrc(product.image)} />
    </main>
  );
}
