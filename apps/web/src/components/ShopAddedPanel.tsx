'use client';

import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { sizeLabel } from '../../../one-pager/src/lib/shop.ts';
import { shopText } from '../i18n/shop-copy';
import { useLanguage } from '../i18n/provider';
import { linePrice, type ShopLine } from '../shop/order';
import { useShopProducts } from '../shop/product-context';

export function ShopAddedPanel({ line, image, subtotal, onClose }: { line: ShopLine; image?: string; subtotal: number; onClose: () => void }) {
  const { language } = useLanguage();
  const onCloseRef = useRef(onClose);
  const [shown, setShown] = useState(false);
  onCloseRef.current = onClose;
  const product = useShopProducts().find((item) => item.id === line.productId);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onCloseRef.current();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!product) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label={shopText(language, 'close')} className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="added-title"
        className={`absolute inset-y-0 right-0 z-10 flex w-full max-w-md flex-col border-l border-white/10 bg-ozora-navy shadow-[0_18px_50px_rgba(0,0,0,0.35)] transition-transform duration-200 ${
          shown ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <h2 id="added-title" className="font-display text-2xl font-bold text-ozora-cream">
            {shopText(language, 'added')}
          </h2>
          <button
            type="button"
            autoFocus
            aria-label={shopText(language, 'close')}
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ozora-cream transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
          <div className="flex gap-4">
            <div className="flex h-24 w-20 shrink-0 items-center justify-center rounded-2xl bg-ozora-cream/[0.04] p-1">
              {image ? <img src={image} alt="" className="max-h-full w-full object-contain" /> : null}
            </div>
            <div className="min-w-0">
              <p className="font-display text-lg font-bold text-ozora-cream">{product.name}</p>
              <p className="text-sm text-ozora-cream/65">
                {shopText(language, 'size')} {sizeLabel(line.size, language)}
              </p>
              <p className="text-sm text-ozora-cream/65">
                {shopText(language, 'quantity')} {line.quantity}
              </p>
              <p className="mt-1 text-sm font-bold text-ozora-yellow">€{linePrice(line.quantity)}</p>
            </div>
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ozora-cream/60">{shopText(language, 'subtotal')}</p>
            <p className="text-2xl font-bold text-ozora-yellow">€{subtotal}</p>
          </div>
          <a
            href="/shop/cart"
            className="inline-flex h-12 items-center justify-center rounded-full bg-ozora-yellow text-sm font-bold text-ozora-ink transition hover:bg-ozora-coral"
          >
            {shopText(language, 'viewCart')}
          </a>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 text-sm font-bold text-ozora-cream transition hover:bg-white/10"
          >
            {shopText(language, 'continue')}
          </button>
        </div>
      </aside>
    </div>
  );
}
