'use client';

import { sizeLabel } from '../../../one-pager/src/lib/shop.ts';
import { shopText } from '../i18n/shop-copy';
import { useLanguage } from '../i18n/provider';
import { linePrice, shopOrderMessage, shopProducts, shopTotal, shopWhatsappUrl } from '../shop/order';
import { useShopCart } from '../shop/useShopCart';
import type { ShopImageSources } from '../shop/images';
import { ShopSteps } from './ShopSteps';

export function ShopReview({ imageSources }: { imageSources: ShopImageSources }) {
  const { language } = useLanguage();
  const cart = useShopCart();
  if (!cart.ready) {
    return <section className="min-h-[50vh] px-5 py-10 md:px-8 md:py-14" />;
  }
  const message = shopOrderMessage(cart.lines, cart.address, language);
  const buyHref = message ? shopWhatsappUrl(message) : undefined;

  return (
    <section className="px-5 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-4xl font-bold tracking-tight text-ozora-cream">{shopText(language, 'review')}</h1>
        <ShopSteps current="review" />
        {cart.lines.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-ozora-navy/55 p-8 text-center">
            <p className="text-sm text-ozora-cream/75">{shopText(language, 'empty')}</p>
            <a
              href="/shop"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-ozora-yellow px-5 text-sm font-bold text-ozora-ink transition hover:bg-ozora-coral"
            >
              {shopText(language, 'continue')}
            </a>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {cart.lines.map((line) => {
              const product = shopProducts().find((item) => item.id === line.productId);
              if (!product) {
                return null;
              }
              return (
                <article key={`${line.productId}-${line.size}`} className="flex gap-4 rounded-3xl border border-white/10 bg-ozora-navy/55 p-4">
                  <div className="flex h-24 w-20 shrink-0 items-center justify-center rounded-2xl bg-ozora-cream/[0.04] p-1">
                    {imageSources[line.productId] ? <img src={imageSources[line.productId]} alt="" className="max-h-full w-full object-contain" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-lg font-bold text-ozora-cream">{product.name}</p>
                        <p className="text-sm text-ozora-cream/65">
                          {shopText(language, 'size')} {sizeLabel(line.size, language)}
                        </p>
                        <p className="text-sm text-ozora-cream/65">
                          {shopText(language, 'quantity')} {line.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-ozora-yellow">€{linePrice(line.quantity)}</p>
                    </div>
                  </div>
                </article>
              );
            })}
            <div className="rounded-3xl border border-white/10 bg-ozora-navy/55 p-5">
              <h2 className="font-display text-xl font-bold text-ozora-cream">{shopText(language, 'delivery')}</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ozora-cream/75">
                {[
                  cart.address.name,
                  cart.address.line1,
                  cart.address.line2,
                  cart.address.city,
                  cart.address.region,
                  cart.address.postalCode,
                  cart.address.country,
                ]
                  .filter((line) => line.trim() !== '')
                  .join('\n')}
              </p>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ozora-cream/60">{shopText(language, 'total')}</p>
                <p className="text-2xl font-bold text-ozora-yellow">€{shopTotal(cart.lines)}</p>
              </div>
              {buyHref ? (
                <a
                  href={buyHref}
                  className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-emerald-400 text-sm font-bold text-ozora-ink transition hover:bg-emerald-300"
                >
                  {shopText(language, 'buy')}
                </a>
              ) : (
                <button type="button" disabled className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-white/10 text-sm font-bold text-ozora-cream/40">
                  {shopText(language, 'buy')}
                </button>
              )}
              <p className="mt-3 text-xs leading-relaxed text-ozora-cream/55">{shopText(language, 'note')}</p>
              <a href="/shop/checkout" className="mt-4 inline-flex text-sm font-semibold text-ozora-turquoise hover:text-ozora-cream">
                {shopText(language, 'backAddress')}
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
