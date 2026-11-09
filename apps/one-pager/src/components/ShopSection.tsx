import { useEffect, useRef, useState, type JSX } from 'react';
import { MapPin, Shirt } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import {
  SHOP_PICKUP,
  SHOP_PRICE_EUR,
  SHOP_PRODUCTS,
  WHATSAPP_DISPLAY,
  liveSizes,
  sizeLabel,
  stockCount,
  stockMeterPercent,
  totalTeeCount,
  whatsappReserveUrl,
  type ShopProduct,
} from '@/lib/shop';

type CopyState = 'idle' | 'copied' | 'fallback';

function productMeta(product: ShopProduct, metaHw: string, metaPg: string): string {
  return product.id === 'hw' ? metaHw : metaPg;
}

function reserveLabel(product: ShopProduct, bookHw: string, bookPg: string): string {
  return product.id === 'hw' ? bookHw : bookPg;
}

export function ShopSection(): JSX.Element {
  const { language, t } = useI18n();
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const numberRef = useRef<HTMLSpanElement>(null);
  const total = totalTeeCount();

  useEffect(() => {
    setCopyState('idle');
  }, [language]);

  const copyNumber = (): void => {
    void navigator.clipboard.writeText(WHATSAPP_DISPLAY).then(
      () => setCopyState('copied'),
      () => {
        const node = numberRef.current;
        if (node) {
          const range = document.createRange();
          range.selectNodeContents(node);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
        setCopyState('fallback');
      },
    );
  };

  const copyLabel =
    copyState === 'copied' ? t.shopCopied : copyState === 'fallback' ? t.shopCopyFallback : t.shopCopyNumber;

  return (
    <section id="shop" className="scroll-mt-24 px-5 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ozora-turquoise md:text-sm">
            {t.shopTagline}
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold leading-tight text-ozora-cream md:text-4xl">
            {t.shopHeadline}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ozora-cream/85 md:text-base">{t.shopLead}</p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-ozora-pink/50 bg-ozora-pink/10 px-3.5 py-1.5 text-[13px] font-semibold text-ozora-cream">
            <span className="h-2 w-2 rounded-full bg-ozora-pink shadow-[0_0_10px_#FF4FA3]" aria-hidden="true" />
            {t.shopTotal(total)}
          </p>
          <div className="mt-6">
            <a
              href={whatsappReserveUrl(t.shopWhatsAppMessage(''))}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex w-full items-center justify-center rounded-xl bg-ozora-green px-5 py-3 text-sm font-bold text-ozora-cream transition hover:-translate-y-px hover:bg-ozora-yellow hover:text-ozora-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow sm:w-auto"
            >
              {t.shopReserveWhatsApp}
            </a>
          </div>
        </div>

        <div className="mt-12">
          <h3 className="text-2xl font-bold text-ozora-cream md:text-3xl">{t.shopPiecesTitle}</h3>
          <p className="mt-2 text-sm text-ozora-cream/75">{t.shopPiecesSubtitle}</p>

          <div className="mt-5 space-y-4">
            {SHOP_PRODUCTS.map((product) => {
              const sizes = liveSizes(product);
              const count = stockCount(product);
              const meta = productMeta(product, t.shopMetaHw, t.shopMetaPg);
              return (
                <article
                  key={product.id}
                  className={`flex flex-col gap-4 rounded-2xl border p-4 md:min-h-[15rem] md:flex-row md:items-start ${
                    product.highlighted
                      ? 'border-ozora-yellow/60 bg-ozora-yellow/10 shadow-glow'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <img
                    src={product.image}
                    alt={product.imageAlt}
                    width={1000}
                    height={product.id === 'hw' ? 1107 : 1063}
                    loading="lazy"
                    className="mx-auto aspect-[3/4] w-full max-w-[260px] rounded-xl object-cover md:mx-0 md:aspect-[4/5] md:w-44 md:max-w-none"
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span
                      className={`mb-1 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${
                        product.highlighted
                          ? 'bg-ozora-yellow/20 text-ozora-yellow'
                          : 'bg-ozora-turquoise/15 text-ozora-turquoise'
                      }`}
                    >
                      {product.highlighted ? t.shopChipParty : t.shopChipDrop}
                    </span>
                    <h3 className="text-lg font-semibold text-ozora-cream">{product.name}</h3>
                    <p className="mt-1 flex items-center gap-2 text-sm text-ozora-cream/75">
                      <Shirt size={16} aria-hidden="true" className="shrink-0" />
                      {meta}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-ozora-turquoise">
                      <MapPin size={16} aria-hidden="true" className="shrink-0" />
                      {SHOP_PICKUP}
                    </p>
                    <p className="mt-2.5 text-3xl font-bold tabular-nums tracking-tight text-ozora-cream">
                      €{SHOP_PRICE_EUR}
                    </p>

                    <div className="mt-3 grid gap-2 rounded-xl border border-ozora-pink/50 bg-ozora-pink/10 px-3 py-2.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2.5">
                        <p className="text-[15px] font-bold text-ozora-cream">
                          <b className="mr-1 text-[22px] tabular-nums text-ozora-pink">{count}</b>
                          {t.shopLeft(count)}
                        </p>
                        <p className="text-xs font-bold uppercase tracking-wide text-ozora-yellow">
                          {product.stockNote === 'lastRun' ? t.shopLastRun : t.shopMadeToOrder}
                        </p>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                        <span
                          className="block h-full rounded-full bg-gradient-to-r from-ozora-pink to-ozora-yellow"
                          style={{ width: `${stockMeterPercent(count)}%` }}
                        />
                      </div>
                    </div>

                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-ozora-cream/70">
                      {t.shopSizes}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {sizes.map((size) => (
                        <span
                          key={size.code}
                          className={`inline-flex items-baseline gap-1.5 rounded-xl border px-3 py-2 ${
                            size.count === 1
                              ? 'border-ozora-pink/50 bg-ozora-pink/10'
                              : 'border-ozora-turquoise/70 bg-ozora-turquoise/10'
                          }`}
                        >
                          <b className="text-base">{sizeLabel(size.code, language)}</b>
                          <span
                            className={`text-xs tabular-nums ${
                              size.count === 1 ? 'font-semibold text-ozora-pink' : 'text-ozora-cream/75'
                            }`}
                          >
                            {size.count === 1 ? t.shopLastOne : t.shopManyLeft(size.count)}
                          </span>
                        </span>
                      ))}
                    </div>

                    <a
                      href={whatsappReserveUrl(t.shopWhatsAppMessage(product.whatsappItem))}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-3.5 inline-flex w-fit items-center justify-center rounded-lg bg-ozora-green px-4 py-2 text-sm font-semibold text-ozora-cream transition hover:-translate-y-px hover:bg-ozora-yellow hover:text-ozora-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow"
                    >
                      {reserveLabel(product, t.shopBookHw, t.shopBookPg)}
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="mt-12">
          <h3 className="text-2xl font-bold text-ozora-cream md:text-3xl">{t.shopHowTitle}</h3>
          <p className="mt-2 text-sm text-ozora-cream/75">{t.shopHowSubtitle}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-black/25 p-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ozora-turquoise/15 font-bold text-ozora-turquoise">
                1
              </span>
              <div>
                <h4 className="text-base font-semibold text-ozora-cream">{t.shopStep1Title}</h4>
                <p className="mt-1 text-sm text-ozora-cream/75">{t.shopStep1Body}</p>
              </div>
            </div>
            <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-black/25 p-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ozora-turquoise/15 font-bold text-ozora-turquoise">
                2
              </span>
              <div>
                <h4 className="text-base font-semibold text-ozora-cream">{t.shopStep2Title}</h4>
                <p className="mt-1 text-sm text-ozora-cream/75">{t.shopStep2Body}</p>
                <p className="mt-2 break-words rounded-[10px] bg-black/35 px-3 py-2.5 text-sm text-ozora-cream">
                  {t.shopStep2Sample}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                  <span ref={numberRef} className="select-all font-semibold text-ozora-cream">
                    {WHATSAPP_DISPLAY}
                  </span>
                  <button
                    type="button"
                    onClick={copyNumber}
                    className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-ozora-cream transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow"
                  >
                    {copyLabel}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-black/25 p-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ozora-turquoise/15 font-bold text-ozora-turquoise">
                3
              </span>
              <div>
                <h4 className="text-base font-semibold text-ozora-cream">{t.shopStep3Title}</h4>
                <p className="mt-1 text-sm text-ozora-cream/75">{t.shopStep3Body}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
