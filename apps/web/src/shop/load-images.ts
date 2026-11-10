import { shirtSrc } from '../events/assets.ts';
import type { ShopImageSources } from './images';

export function productImageSrc(image: string | undefined): string | undefined {
  if (image?.startsWith('/shop/media/')) {
    const id = image.slice('/shop/media/'.length);
    return /^[A-Za-z0-9_-]{1,40}$/.test(id) ? image : undefined;
  }
  return shirtSrc(image);
}

export function loadShopImages(products: readonly { id: string; image: string }[]): ShopImageSources {
  const imageSources: Record<string, string> = {};
  for (const product of products) {
    const source = productImageSrc(product.image);
    if (source !== undefined) {
      imageSources[product.id] = source;
    }
  }
  return imageSources;
}
