'use client';

import { Trash2 } from 'lucide-react';
import { sizeLabel } from '../../../one-pager/src/lib/shop.ts';
import { shopText } from '../i18n/shop-copy';
import { useLanguage } from '../i18n/provider';
import { sizeStock } from '../shop/cart';
import { linePrice, shopProducts, shopTotal } from '../shop/order';
import { useShopCart } from '../shop/useShopCart';
import type { ShopImageSources } from '../shop/images';
import { QuantityStepper } from './ShopQuantity';
import { ShopSteps } from './ShopSteps';

export function ShopCart({ imageSources }: { imageSources: ShopImageSources }) {
  const { language } = useLanguage();
  const cart = useShopCart();
  if (!cart.ready) {
    return <section className="min-h-[50vh] px-5 py-10 md:px-8 md:py-14" />;
  }

  return (
    <section className="px-5 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-4xl font-bold tracking-tight text-ozora-cream">{shopText(language, 'cart')}</h1>
        <ShopSteps current="cart" />
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
          <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="space-y-4">
              {cart.lines.map((line) => {
                const product = shopProducts().find((item) => item.id === line.productId);
                const stock = sizeStock(line.productId, line.size);
                if (!product) {
                  return null;
                }
                return (
                  <article key={`${line.productId}-${line.size}`} className="flex gap-4 rounded-3xl border border-white/10 bg-ozora-navy/55 p-4">
                    <a href={`/shop/${line.productId}`} className="flex h-24 w-20 shrink-0 items-center justify-center rounded-2xl bg-ozora-cream/[0.04] p-1">
                      {imageSources[line.productId] ? <img src={imageSources[line.productId]} alt="" className="max-h-full w-full object-contain" /> : null}
                    </a>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <a href={`/shop/${line.productId}`} className="font-display text-lg font-bold text-ozora-cream hover:text-ozora-yellow">
                            {product.name}
                          </a>
                          <p className="text-sm text-ozora-cream/65">
                            {shopText(language, 'size')} {sizeLabel(line.size, language)}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-ozora-yellow">€{linePrice(line.quantity)}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <QuantityStepper
                          quantity={line.quantity}
                          max={stock}
                          decreaseLabel={shopText(language, 'decrease')}
                          increaseLabel={shopText(language, 'increase')}
                          onChange={(quantity) => cart.setQuantity(line.productId, line.size, quantity)}
                        />
                        <button
                          type="button"
                          onClick={() => cart.remove(line.productId, line.size)}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ozora-cream/70 hover:text-ozora-coral"
                        >
                          <Trash2 size={15} aria-hidden="true" />
                          {shopText(language, 'remove')}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            <aside className="rounded-3xl border border-white/10 bg-ozora-navy/55 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ozora-cream/60">{shopText(language, 'subtotal')}</p>
                <p className="text-2xl font-bold text-ozora-yellow">€{shopTotal(cart.lines)}</p>
              </div>
              <a
                href="/shop/checkout"
                className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-ozora-yellow text-sm font-bold text-ozora-ink transition hover:bg-ozora-coral"
              >
                {shopText(language, 'checkout')}
              </a>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
