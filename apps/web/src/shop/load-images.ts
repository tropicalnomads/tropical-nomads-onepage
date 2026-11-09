import { shirtSrc } from '../events/assets';
import type { ShopImageSources } from './images';
import { shopProducts } from './order';

export function loadShopImages(): ShopImageSources {
  const imageSources: ShopImageSources = {};
  for (const product of shopProducts()) {
    const source = shirtSrc(product.image);
    if (source !== undefined) {
      imageSources[product.id] = source;
    }
  }
  return imageSources;
}
