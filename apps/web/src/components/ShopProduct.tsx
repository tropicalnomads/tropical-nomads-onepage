'use client';

import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { sizeLabel, type ShopSizeCode } from '../../../one-pager/src/lib/shop.ts';
import { shopLeft, shopText } from '../i18n/shop-copy';
import { useLanguage } from '../i18n/provider';
import { publicHref } from '../seo/urls';
import { catalogSizes, shopAmountLabel, shopProductDescription, stockCount } from '../shop/catalog';
import { ShopMarkdown } from '../shop/markdown';
import { shopTotalLabel, type ShopLine } from '../shop/order';
import { useShopProducts } from '../shop/product-context';
import { useShopCart } from '../shop/useShopCart';
import { ShopAddedPanel } from './ShopAddedPanel';
import { ShopMissing } from './ShopCatalog';
import { ShopImagePlaceholder } from './ShopImagePlaceholder';
import { QuantityStepper } from './ShopQuantity';

export function ShopProduct({ productId, image }: { productId: string; image?: string }) {
  const { language } = useLanguage();
  const cart = useShopCart();
  const products = useShopProducts();
  const product = products.find((item) => item.id === productId);
  const sizes = product ? catalogSizes(product.stock) : [];
  const [size, setSize] = useState<ShopSizeCode | undefined>(sizes.find((item) => item.count > 0)?.code);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState<ShopLine | null>(null);
  if (!product) {
    return <ShopMissing />;
  }
  const selected = sizes.find((item) => item.code === size) ?? sizes[0];
  const stock = selected?.count ?? 0;
  const chosen = Math.min(Math.max(quantity, 1), Math.max(stock, 1));

  const chooseSize = (code: ShopSizeCode): void => {
    const next = sizes.find((item) => item.code === code);
    if (!next || next.count < 1) {
      return;
    }
    setSize(code);
    setQuantity((current) => Math.min(Math.max(current, 1), next.count));
  };

  const add = (): void => {
    if (!selected || stock < 1) {
      return;
    }
    const line: ShopLine = { productId: product.id, size: selected.code, quantity: chosen };
    cart.add(line);
    setAdded(line);
  };

  return (
    <section className="px-5 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-5xl">
        <a
          href={publicHref('/shop', language)}
          className="mb-6 inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-sm font-bold text-ozora-cream transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {shopText(language, 'back')}
        </a>
        <div className="grid gap-8 md:grid-cols-[minmax(0,22rem)_1fr] md:items-start">
          <div className="flex aspect-[4/5] items-center justify-center rounded-3xl border border-white/10 bg-ozora-cream/[0.04] p-6">
            {image ? <img src={image} alt={product.name} className="max-h-full w-full object-contain" /> : <ShopImagePlaceholder />}
          </div>
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-ozora-cream">{product.name}</h1>
            <div className="mt-2 text-sm leading-relaxed text-ozora-cream/70">
              <ShopMarkdown text={shopProductDescription(product, language)} />
            </div>
            <p className="mt-4 text-3xl font-bold text-ozora-yellow">{shopAmountLabel(product.amount, product.currency)}</p>
            {stockCount(product.stock) === 0 ? (
              <p className="mt-2 text-sm font-bold uppercase tracking-[0.16em] text-ozora-coral">{shopText(language, 'soldOutLabel')}</p>
            ) : null}

            <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-ozora-cream/55">{shopText(language, 'size')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {sizes.map((item) => {
                const active = item.code === selected?.code && item.count > 0;
                const gone = item.count < 1;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => chooseSize(item.code)}
                    disabled={gone}
                    aria-pressed={active}
                    className={`min-w-16 rounded-2xl border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise disabled:cursor-not-allowed ${
                      active
                        ? 'border-ozora-yellow bg-ozora-yellow text-ozora-ink'
                        : gone
                          ? 'border-white/10 bg-black/20 text-ozora-cream/35'
                          : 'border-white/15 bg-black/25 text-ozora-cream hover:border-ozora-yellow/50'
                    }`}
                  >
                    <span className="block text-sm font-bold">{sizeLabel(item.code, language)}</span>
                    <span className={`block text-[11px] font-semibold ${active ? 'text-ozora-ink/70' : gone ? 'text-ozora-coral/80' : 'text-ozora-cream/55'}`}>
                      {gone ? shopText(language, 'soldOutLabel') : shopLeft(language, item.count)}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-ozora-cream/55">{shopText(language, 'quantity')}</p>
            <div className="mt-3">
              <QuantityStepper
                quantity={stock > 0 ? chosen : 0}
                max={stock}
                decreaseLabel={shopText(language, 'decrease')}
                increaseLabel={shopText(language, 'increase')}
                onChange={setQuantity}
              />
            </div>

            <button
              type="button"
              onClick={add}
              disabled={stock < 1}
              className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-ozora-yellow px-6 text-sm font-bold text-ozora-ink transition hover:bg-ozora-coral disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-ozora-cream/40"
            >
              {shopText(language, 'add')}
            </button>
          </div>
        </div>
      </div>
      {added ? (
        <ShopAddedPanel
          line={cart.lines.find((item) => item.productId === added.productId && item.size === added.size) ?? added}
          image={image}
          subtotal={shopTotalLabel(cart.lines, products)}
          onClose={() => setAdded(null)}
        />
      ) : null}
    </section>
  );
}
