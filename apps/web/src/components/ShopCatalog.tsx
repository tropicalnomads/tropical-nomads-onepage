'use client';

import { stockCount } from '../../../one-pager/src/lib/shop.ts';
import { shopProductMeta, shopText } from '../i18n/shop-copy';
import { useLanguage } from '../i18n/provider';
import type { ShopImageSources } from '../shop/images';
import { shopPriceEur, shopProducts } from '../shop/order';

export type { ShopImageSources };

const cardClass =
  'group overflow-hidden rounded-3xl border border-white/10 bg-ozora-navy/55 shadow-[0_18px_50px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:border-ozora-yellow/40';

export function ShopCatalog({ imageSources }: { imageSources: ShopImageSources }) {
  const { language } = useLanguage();
  const products = shopProducts();

  return (
    <section className="px-5 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-ozora-yellow">{shopText(language, 'title')}</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ozora-cream md:text-5xl">{shopText(language, 'title')}</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ozora-cream/75">{shopText(language, 'subtitle')}</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {products.map((product) => (
            <a key={product.id} href={`/shop/${product.id}`} className={cardClass}>
              <div className="flex aspect-[4/5] items-center justify-center bg-ozora-cream/[0.04] p-6">
                {imageSources[product.id] ? (
                  <img src={imageSources[product.id]} alt={product.name} className="max-h-full w-full object-contain transition duration-300 group-hover:scale-[1.02]" />
                ) : null}
              </div>
              <div className="space-y-2 p-5">
                <h2 className="font-display text-2xl font-bold text-ozora-cream">{product.name}</h2>
                <p className="text-sm leading-relaxed text-ozora-cream/70">{shopProductMeta(language, product.id)}</p>
                <div className="flex items-end justify-between gap-3 pt-2">
                  <p className="text-xl font-bold text-ozora-yellow">€{shopPriceEur}</p>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ozora-cream/55">
                    {stockCount(product)} {shopText(language, 'inStock')}
                  </p>
                </div>
                <p className="text-sm font-semibold text-ozora-turquoise">{shopText(language, 'view')}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ShopMissing() {
  const { language } = useLanguage();
  return (
    <section className="px-5 py-16 md:px-8">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-ozora-navy/55 p-8 text-center">
        <h1 className="font-display text-3xl font-bold text-ozora-cream">{shopText(language, 'missingTitle')}</h1>
        <p className="mt-3 text-sm leading-relaxed text-ozora-cream/70">{shopText(language, 'missingBody')}</p>
        <a
          href="/shop"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-ozora-yellow px-5 text-sm font-bold text-ozora-ink transition hover:bg-ozora-coral"
        >
          {shopText(language, 'back')}
        </a>
      </div>
    </section>
  );
}
