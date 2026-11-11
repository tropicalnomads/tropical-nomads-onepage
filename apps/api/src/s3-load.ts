// Public pages load the modules that call these functions. The S3 client has to
// stay out of that evaluation. Amplify's web compute cannot resolve it, so a
// top-level import turns every page into a 500 while /health keeps answering.

export function loadCatalogImages() {
  return import('./catalog-images.ts');
}

export function loadShopProducts() {
  return import('./shop-products.ts');
}
