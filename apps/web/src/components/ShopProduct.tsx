'use client';

import { useState } from 'react';
import { liveSizes, sizeLabel, type ShopSizeCode } from '../../../one-pager/src/lib/shop.ts';
import { shopLeft, shopProductMeta, shopText } from '../i18n/shop-copy';
import { useLanguage } from '../i18n/provider';
import { shopPriceEur, shopProducts, shopTotal, type ShopLine } from '../shop/order';
import { useShopCart } from '../shop/useShopCart';
import { ShopAddedPanel } from './ShopAddedPanel';
import { ShopMissing } from './ShopCatalog';
import { QuantityStepper } from './ShopQuantity';

export function ShopProduct({ productId, image }: { productId: string; image?: string }) {
  const { language } = useLanguage();
  const cart = useShopCart();
  const product = shopProducts().find((item) => item.id === productId);
  const sizes = product ? liveSizes(product) : [];
  const [size, setSize] = useState<ShopSizeCode | undefined>(sizes[0]?.code);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState<ShopLine | null>(null);
  if (!product || (product.id !== 'hw' && product.id !== 'pg')) {
    return <ShopMissing />;
  }
  const selected = sizes.find((item) => item.code === size) ?? sizes[0];
  const stock = selected?.count ?? 0;
  const chosen = Math.min(Math.max(quantity, 1), Math.max(stock, 1));

  const chooseSize = (code: ShopSizeCode): void => {
    const next = sizes.find((item) => item.code === code);
    setSize(code);
    if (next) {
      setQuantity((current) => Math.min(Math.max(current, 1), next.count));
    }
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
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[minmax(0,22rem)_1fr] md:items-start">
        <div className="flex aspect-[4/5] items-center justify-center rounded-3xl border border-white/10 bg-ozora-cream/[0.04] p-6">
          {image ? <img src={image} alt={product.name} className="max-h-full w-full object-contain" /> : null}
        </div>
        <div>
          <a href="/shop" className="text-sm font-semibold text-ozora-turquoise hover:text-ozora-cream">
            {shopText(language, 'back')}
          </a>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-ozora-cream">{product.name}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ozora-cream/70">{shopProductMeta(language, product.id)}</p>
          <p className="mt-4 text-3xl font-bold text-ozora-yellow">€{shopPriceEur}</p>

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-ozora-cream/55">{shopText(language, 'size')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sizes.map((item) => {
              const active = item.code === selected?.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => chooseSize(item.code)}
                  aria-pressed={active}
                  className={`min-w-16 rounded-2xl border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise ${
                    active ? 'border-ozora-yellow bg-ozora-yellow text-ozora-ink' : 'border-white/15 bg-black/25 text-ozora-cream hover:border-ozora-yellow/50'
                  }`}
                >
                  <span className="block text-sm font-bold">{sizeLabel(item.code, language)}</span>
                  <span className={`block text-[11px] font-semibold ${active ? 'text-ozora-ink/70' : 'text-ozora-cream/55'}`}>{shopLeft(language, item.count)}</span>
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
      {added ? (
        <ShopAddedPanel
          line={cart.lines.find((item) => item.productId === added.productId && item.size === added.size) ?? added}
          image={image}
          subtotal={shopTotal(cart.lines)}
          onClose={() => setAdded(null)}
        />
      ) : null}
    </section>
  );
}
