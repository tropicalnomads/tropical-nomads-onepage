import { ShopCatalog, type ShopImageSources } from '../../src/components/ShopCatalog';
import { shirtSrc } from '../../src/events/assets';
import { shopProducts } from '../../src/shop/order';

export default function ShopPage() {
  const imageSources: ShopImageSources = {};
  for (const product of shopProducts()) {
    const source = shirtSrc(product.image);
    if (source !== undefined) {
      imageSources[product.id] = source;
    }
  }

  return (
    <main>
      <ShopCatalog imageSources={imageSources} />
    </main>
  );
}
