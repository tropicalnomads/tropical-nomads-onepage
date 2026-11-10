'use client';

import { Eye, EyeOff, Pencil } from 'lucide-react';
import { sizeLabel, type ShopSizeCode } from '../../../one-pager/src/lib/shop.ts';
import type { ShopOrderRow } from '../admin/shop-values';
import { shopText } from '../i18n/shop-copy';
import { useLanguage } from '../i18n/provider';
import { shopAmountLabel, type ShopCatalogProduct } from '../shop/catalog';
import { ShopImagePlaceholder } from './ShopImagePlaceholder';

function adminProductImageSrc(product: ShopCatalogProduct): string | undefined {
  if (!product.image.startsWith('/shop/media/')) {
    return undefined;
  }
  const id = product.image.slice('/shop/media/'.length);
  return id === product.id && /^[A-Za-z0-9_-]{1,40}$/.test(id) ? product.image : undefined;
}

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

export function AdminShopOrders({ orders, products }: { orders: readonly ShopOrderRow[]; products: readonly ShopCatalogProduct[] }) {
  const { language } = useLanguage();
  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ozora-cream md:text-3xl">{shopText(language, 'admin')}</h1>
        <a href="/admin/shop/new" className="rounded-full bg-ozora-yellow px-4 py-2 text-sm font-bold text-ozora-ink">
          {shopText(language, 'addProduct')}
        </a>
      </div>
      <a href="/shop" className="mt-3 inline-block text-sm font-semibold text-ozora-turquoise">
        {shopText(language, 'backShop')}
      </a>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold text-ozora-cream">{shopText(language, 'productsLabel')}</h2>
          <span className="text-sm text-ozora-cream/45">{products.length}</span>
        </div>
        {products.length === 0 ? <p className="mt-4 text-sm text-ozora-cream/65">{shopText(language, 'noProducts')}</p> : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {products.map((product) => {
            const source = adminProductImageSrc(product);
            return (
              <article key={product.id} className="flex gap-4 rounded-3xl border border-white/10 bg-ozora-navy/55 p-3">
                <div className="flex aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-2xl bg-black/25 p-2">
                  {source ? <img src={source} alt="" className="h-full w-full object-contain" /> : <ShopImagePlaceholder />}
                </div>
                <div className="flex min-w-0 flex-1 flex-col py-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="truncate font-bold text-ozora-cream">{product.name}</h3>
                      <p className="mt-1 text-sm font-bold text-ozora-yellow">{shopAmountLabel(product.amount, product.currency)}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.65rem] font-bold ${
                        product.hidden ? 'bg-ozora-coral/10 text-ozora-coral' : 'bg-emerald-400/10 text-emerald-300'
                      }`}
                    >
                      {product.hidden ? <EyeOff size={12} aria-hidden="true" /> : <Eye size={12} aria-hidden="true" />}
                      {shopText(language, product.hidden ? 'hiddenProduct' : 'visibleProduct')}
                    </span>
                  </div>
                  <a
                    href={`/admin/shop/${product.id}`}
                    className="mt-auto inline-flex h-9 w-fit items-center gap-2 rounded-full border border-white/15 px-3 text-xs font-bold text-ozora-cream transition hover:bg-white/10"
                  >
                    <Pencil size={13} aria-hidden="true" />
                    {shopText(language, 'editProduct')}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <h2 className="mt-10 font-display text-2xl font-bold text-ozora-cream">{shopText(language, 'orders')}</h2>
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
