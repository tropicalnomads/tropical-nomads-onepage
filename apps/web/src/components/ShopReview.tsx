'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sizeLabel } from '../../../one-pager/src/lib/shop.ts';
import { shopText } from '../i18n/shop-copy';
import { useLanguage } from '../i18n/provider';
import { publicHref } from '../seo/urls';
import { shopAmountLabel } from '../shop/catalog';
import { linePrice, shopConfirmationKey, shopConfirmationRecord, shopOrderMessage, shopTotalLabel } from '../shop/order';
import { placeShopOrderAction, type PlaceShopOrderResult } from '../shop/actions';
import { useShopProducts } from '../shop/product-context';
import { useShopCart } from '../shop/useShopCart';
import type { ShopImageSources } from '../shop/images';
import { ShopSteps } from './ShopSteps';

function orderFailure(reason: Extract<PlaceShopOrderResult, { ok: false }>['reason'], language: 'en' | 'pt'): string {
  switch (reason) {
    case 'sold-out':
      return shopText(language, 'soldOut');
    case 'unavailable':
      return shopText(language, 'orderFailed');
    default: {
      const unexpected: never = reason;
      return unexpected;
    }
  }
}

export function ShopReview({ imageSources }: { imageSources: ShopImageSources }) {
  const { language } = useLanguage();
  const products = useShopProducts();
  const cart = useShopCart();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<Extract<PlaceShopOrderResult, { ok: false }>['reason']>();
  const sending = useRef(false);
  if (!cart.ready) {
    return <section className="min-h-[50vh] px-5 py-10 md:px-8 md:py-14" />;
  }
  const message = shopOrderMessage(cart.lines, cart.address, language, products);
  const canBuy = message !== undefined && !pending;

  async function buy(): Promise<void> {
    if (!message || sending.current) {
      return;
    }
    sending.current = true;
    setPending(true);
    setFailure(undefined);
    const result = await placeShopOrderAction({ lines: cart.lines, address: cart.address });
    if (!result.ok) {
      sending.current = false;
      setFailure(result.reason);
      setPending(false);
      if (result.reason === 'sold-out') {
        router.refresh();
      }
      return;
    }
    const saved = shopOrderMessage(cart.lines, cart.address, language, products, result.orderId) ?? message;
    const record = shopConfirmationRecord(result.orderId, saved);
    if (!record) {
      sending.current = false;
      setFailure('unavailable');
      setPending(false);
      return;
    }
    sessionStorage.setItem(shopConfirmationKey, JSON.stringify(record));
    cart.clearLines();
    window.location.assign('/shop/checkout/complete');
  }

  return (
    <section className="px-5 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-4xl font-bold tracking-tight text-ozora-cream">{shopText(language, 'review')}</h1>
        <ShopSteps current="review" />
        {cart.lines.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-ozora-navy/55 p-8 text-center">
            <p className="text-sm text-ozora-cream/75">{shopText(language, 'empty')}</p>
            <a
              href={publicHref('/shop', language)}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-ozora-yellow px-5 text-sm font-bold text-ozora-ink transition hover:bg-ozora-coral"
            >
              {shopText(language, 'continue')}
            </a>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {cart.lines.map((line) => {
              const product = products.find((item) => item.id === line.productId);
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
                      <p className="text-sm font-bold text-ozora-yellow">{shopAmountLabel(linePrice(line.quantity, product.amount), product.currency)}</p>
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
                <p className="text-2xl font-bold text-ozora-yellow">{shopTotalLabel(cart.lines, products)}</p>
              </div>
              <button
                type="button"
                disabled={!canBuy}
                onClick={() => {
                  void buy();
                }}
                className={
                  canBuy
                    ? 'mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-emerald-400 text-sm font-bold text-ozora-ink transition hover:bg-emerald-300'
                    : 'mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-white/10 text-sm font-bold text-ozora-cream/40'
                }
              >
                {shopText(language, 'buy')}
              </button>
              {failure ? <p className="mt-3 text-sm text-ozora-coral">{orderFailure(failure, language)}</p> : null}
              <p className="mt-3 text-xs leading-relaxed text-ozora-cream/55">{shopText(language, 'note')}</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <a
                  href={publicHref('/shop', language)}
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-bold text-ozora-cream transition hover:bg-white/10"
                >
                  {shopText(language, 'continue')}
                </a>
                <a href="/shop/checkout" className="text-center text-sm font-semibold text-ozora-turquoise hover:text-ozora-cream">
                  {shopText(language, 'backAddress')}
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
