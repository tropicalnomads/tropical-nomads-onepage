'use client';

import { useEffect, useState } from 'react';
import { shopText } from '../i18n/shop-copy';
import { useLanguage } from '../i18n/provider';
import { readShopConfirmation, shopConfirmationKey, shopWhatsappUrl } from '../shop/order';

export function ShopOrderComplete() {
  const { language } = useLanguage();
  const [saved, setSaved] = useState<{ orderId: string; message: string } | null | undefined>(undefined);

  useEffect(() => {
    setSaved(readShopConfirmation(sessionStorage.getItem(shopConfirmationKey)) ?? null);
  }, []);

  if (saved === undefined) {
    return <section className="min-h-[50vh] px-5 py-10 md:px-8 md:py-14" />;
  }

  return (
    <section className="px-5 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-ozora-navy/55 p-8 text-center">
        {saved ? (
          <>
            <h1 className="font-display text-3xl font-bold text-ozora-cream">{shopText(language, 'orderReady')}</h1>
            <p className="mt-3 text-sm text-ozora-cream/70">
              {shopText(language, 'orderNumber')} {saved.orderId}
            </p>
            <a
              href={shopWhatsappUrl(saved.message)}
              className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-emerald-400 px-6 text-sm font-bold text-ozora-ink transition hover:bg-emerald-300"
            >
              {shopText(language, 'openWhatsapp')}
            </a>
          </>
        ) : (
          <h1 className="font-display text-3xl font-bold text-ozora-cream">{shopText(language, 'missingOrder')}</h1>
        )}
        <a
          href="/shop"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-bold text-ozora-cream transition hover:bg-white/10"
        >
          {shopText(language, 'backShop')}
        </a>
      </div>
    </section>
  );
}
