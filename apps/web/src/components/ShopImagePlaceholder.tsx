'use client';

import { ImageIcon } from 'lucide-react';
import { shopText } from '../i18n/shop-copy';
import { useLanguage } from '../i18n/provider';

export function ShopImagePlaceholder() {
  const { language } = useLanguage();
  return (
    <div className="flex h-full w-full flex-col items-center justify-center text-center text-ozora-cream/35">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.05]">
        <ImageIcon size={24} aria-hidden="true" />
      </span>
      <span className="mt-3 text-xs font-bold uppercase tracking-[0.14em]">{shopText(language, 'noImage')}</span>
    </div>
  );
}
