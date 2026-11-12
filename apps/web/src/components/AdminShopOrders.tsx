'use client';

import { Eye, EyeOff, Pencil } from 'lucide-react';
import { orderText } from '../i18n/copy';
import { shopText } from '../i18n/shop-copy';
import { useLanguage } from '../i18n/provider';
import { publicHref } from '../seo/urls';
import { shopAmountLabel, type ShopCatalogProduct } from '../shop/catalog';
import { ShopImagePlaceholder } from './ShopImagePlaceholder';
import { Button } from './ui/Button';

function adminProductImageSrc(product: ShopCatalogProduct): string | undefined {
  if (!product.image.startsWith('/shop/media/')) {
    return undefined;
  }
  const id = product.image.slice('/shop/media/'.length);
  return id === product.id && /^[A-Za-z0-9_-]{1,40}$/.test(id) ? product.image : undefined;
}

export function AdminShopOrders({ products }: { products: readonly ShopCatalogProduct[] }) {
  const { language } = useLanguage();
  return (
    <>
      <Button href={publicHref('/shop', language)} tone="back" size="sm" className="mt-8">
        {shopText(language, 'backShop')}
      </Button>

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
                  <Button href={`/admin/shop/${product.id}`} tone="ghost" size="sm" className="mt-auto h-9 w-fit px-3 text-xs" icon={<Pencil size={13} aria-hidden="true" />}>
                    {shopText(language, 'editProduct')}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <Button href="/admin/orders" className="mt-8">
        {orderText(language, 'openOrders')}
      </Button>
    </>
  );
}
