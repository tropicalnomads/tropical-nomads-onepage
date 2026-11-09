'use client';

import type { Locale } from 'tropical-nomads-shared';
import { shopText } from '../i18n/shop-copy';
import { useLanguage } from '../i18n/provider';

const stepIds = ['cart', 'address', 'review'] as const;

export type ShopStepId = (typeof stepIds)[number];

function stepLabel(language: Locale, id: ShopStepId): string {
  switch (id) {
    case 'cart':
      return shopText(language, 'cart');
    case 'address':
      return shopText(language, 'delivery');
    case 'review':
      return shopText(language, 'review');
    default: {
      const unexpected: never = id;
      return unexpected;
    }
  }
}

function stepHref(id: ShopStepId): string {
  switch (id) {
    case 'cart':
      return '/shop/cart';
    case 'address':
      return '/shop/checkout';
    case 'review':
      return '/shop/checkout/review';
    default: {
      const unexpected: never = id;
      return unexpected;
    }
  }
}

export function ShopSteps({ current }: { current: ShopStepId }) {
  const { language } = useLanguage();
  const currentIndex = stepIds.indexOf(current);

  return (
    <ol className="mt-6 flex flex-wrap items-center gap-2 text-sm">
      {stepIds.map((id, index) => {
        const label = stepLabel(language, id);
        const reached = index < currentIndex;
        const active = id === current;
        return (
          <li key={id} className="flex items-center gap-2">
            {index > 0 ? <span className="text-ozora-cream/30">/</span> : null}
            {reached ? (
              <a href={stepHref(id)} className="font-semibold text-ozora-turquoise hover:text-ozora-cream">
                {label}
              </a>
            ) : (
              <span aria-current={active ? 'step' : undefined} className={active ? 'font-bold text-ozora-yellow' : 'text-ozora-cream/40'}>
                {label}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
