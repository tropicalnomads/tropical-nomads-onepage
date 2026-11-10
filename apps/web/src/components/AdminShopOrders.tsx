'use client';

import { sizeLabel, type ShopSizeCode } from '../../../one-pager/src/lib/shop.ts';
import type { ShopOrderRow } from '../admin/shop-values';
import { shopText } from '../i18n/shop-copy';
import { useLanguage } from '../i18n/provider';
import { shopAmountLabel } from '../shop/catalog';

function paymentLabel(status: ShopOrderRow['status'], language: 'en' | 'pt'): string {
  switch (status) {
    case 'pending_provider':
      return shopText(language, 'unpaid');
    case 'confirmed':
      return shopText(language, 'paid');
    default: {
      const unexpected: never = status;
      return unexpected;
    }
  }
}

function isShopSize(size: string): size is ShopSizeCode {
  switch (size) {
    case 'P':
    case 'M':
    case 'G':
    case 'GG':
    case '2XL':
      return true;
    default:
      return false;
  }
}

function when(value: string, language: 'en' | 'pt'): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(language === 'pt' ? 'pt-PT' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function AdminShopOrders({ orders }: { orders: readonly ShopOrderRow[] }) {
  const { language } = useLanguage();
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ozora-cream md:text-3xl">{shopText(language, 'orders')}</h1>
        <a href="/admin/shop/new" className="rounded-full bg-ozora-yellow px-4 py-2 text-sm font-bold text-ozora-ink">
          {shopText(language, 'addProduct')}
        </a>
      </div>
      <a href="/shop" className="mt-3 inline-block text-sm font-semibold text-ozora-turquoise">
        {shopText(language, 'backShop')}
      </a>
      {orders.length === 0 ? <p className="mt-6 text-sm text-ozora-cream/75">{shopText(language, 'noOrders')}</p> : null}
      <ul className="mt-6 space-y-3">
        {orders.map((order) => (
          <li key={order.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ozora-cream">{order.id}</p>
                <p className="mt-1 text-sm text-ozora-cream/65">{when(order.createdAt, language)}</p>
              </div>
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-ozora-yellow">{paymentLabel(order.status, language)}</p>
            </div>
            <p className="mt-3 text-sm text-ozora-cream/80">
              {[order.buyer, order.city, order.country].filter((part) => part.trim() !== '').join(' · ')}
            </p>
            <ul className="mt-2 space-y-1">
              {order.lines.map((line, index) => (
                <li key={`${order.id}-${index}`} className="text-sm text-ozora-cream/75">
                  {line.quantity} × {line.name}
                  {line.size ? ` · ${isShopSize(line.size) ? sizeLabel(line.size, language) : line.size}` : ''}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm font-bold text-ozora-cream">{shopAmountLabel(order.amount, order.currency)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
