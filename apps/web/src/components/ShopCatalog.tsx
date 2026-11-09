'use client';

import { useState } from 'react';
import { liveSizes, sizeLabel, stockCount, type ShopProduct, type ShopSizeCode } from '../../../one-pager/src/lib/shop.ts';
import { shopText } from '../i18n/shop-copy';
import { useLanguage } from '../i18n/provider';
import { shopOrderMessage, shopProducts, shopTotal, shopWhatsappUrl, type ShopAddress, type ShopLine } from '../shop/order';

const emptyAddress: ShopAddress = { name: '', line1: '', city: '', postalCode: '', country: '' };

export type ShopImageSources = Partial<Record<ShopProduct['id'], string>>;

function productMeta(product: ShopProduct, language: 'en' | 'pt'): string {
  return shopText(language, product.id === 'hw' ? 'metaHw' : 'metaPg');
}

export function ShopCatalog({ imageSources }: { imageSources: ShopImageSources }) {
  const { language } = useLanguage();
  const [lines, setLines] = useState<ShopLine[]>([]);
  const [address, setAddress] = useState<ShopAddress>(emptyAddress);
  const [drafts, setDrafts] = useState<Record<string, { size: ShopSizeCode; quantity: string }>>({});
  const message = shopOrderMessage(lines, address, language);
  const buyHref = message ? shopWhatsappUrl(message) : undefined;

  const addLine = (product: ShopProduct): void => {
    const sizes = liveSizes(product);
    const draft = drafts[product.id];
    const size = draft?.size ?? sizes[0]?.code;
    const quantity = Number(draft?.quantity ?? '1');
    if (!size || !Number.isInteger(quantity) || quantity < 1) {
      return;
    }
    const stock = sizes.find((item) => item.code === size)?.count ?? 0;
    setLines((current) => {
      const existing = current.find((line) => line.productId === product.id && line.size === size);
      const nextQuantity = Math.min(stock, (existing?.quantity ?? 0) + quantity);
      if (nextQuantity < 1) {
        return current;
      }
      const without = current.filter((line) => line.productId !== product.id || line.size !== size);
      return [...without, { productId: product.id, size, quantity: nextQuantity }];
    });
  };

  const setField = (key: keyof ShopAddress, value: string): void => {
    setAddress((current) => ({ ...current, [key]: value }));
  };

  return (
    <section className="px-5 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-ozora-cream md:text-3xl">{shopText(language, 'title')}</h1>
        <p className="mt-2 max-w-2xl text-sm text-ozora-cream/75">{shopText(language, 'subtitle')}</p>
        <div className="mt-6 space-y-4">
          {shopProducts().map((product) => {
            const sizes = liveSizes(product);
            const image = imageSources[product.id];
            const draft = drafts[product.id] ?? { size: sizes[0]?.code ?? 'M', quantity: '1' };
            return (
              <article
                key={product.id}
                className={`flex flex-col gap-4 rounded-2xl border p-4 md:flex-row ${
                  product.highlighted ? 'border-ozora-yellow/60 bg-ozora-yellow/10' : 'border-white/10 bg-black/20'
                }`}
              >
                {image ? (
                  <img src={image} alt={product.imageAlt} className="mx-auto aspect-[3/4] w-full max-w-[260px] rounded-xl object-cover md:mx-0 md:w-44" />
                ) : null}
                <div className="flex flex-1 flex-col">
                  <h2 className="text-lg font-semibold text-ozora-cream">{product.name}</h2>
                  <p className="mt-1 text-sm text-ozora-cream/75">{productMeta(product, language)}</p>
                  <p className="mt-2 text-sm font-semibold text-ozora-cream">€{shopText(language, 'price')}</p>
                  <p className="mt-1 text-xs text-ozora-cream/60">
                    {stockCount(product)} {shopText(language, 'inStock')}
                  </p>
                  <form
                    className="mt-4 flex flex-wrap items-end gap-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      addLine(product);
                    }}
                  >
                    <label className="text-sm text-ozora-cream">
                      {shopText(language, 'size')}
                      <select
                        className="mt-1 block rounded-lg border border-white/15 bg-black/30 px-3 py-2"
                        value={draft.size}
                        onChange={(event) =>
                          setDrafts((current) => ({ ...current, [product.id]: { ...draft, size: event.target.value as ShopSizeCode } }))
                        }
                      >
                        {sizes.map((size) => (
                          <option key={size.code} value={size.code}>
                            {sizeLabel(size.code, language)} · {size.count}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm text-ozora-cream">
                      {shopText(language, 'quantity')}
                      <input
                        className="mt-1 block w-20 rounded-lg border border-white/15 bg-black/30 px-3 py-2"
                        inputMode="numeric"
                        value={draft.quantity}
                        onChange={(event) => setDrafts((current) => ({ ...current, [product.id]: { ...draft, quantity: event.target.value } }))}
                      />
                    </label>
                    <button type="submit" className="rounded-xl bg-ozora-green px-4 py-2 text-sm font-bold text-ozora-cream">
                      {shopText(language, 'add')}
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-4">
          <h2 className="text-lg font-semibold text-ozora-cream">{shopText(language, 'cart')}</h2>
          {lines.length === 0 ? <p className="mt-2 text-sm text-ozora-cream/70">{shopText(language, 'empty')}</p> : null}
          <ul className="mt-3 space-y-2">
            {lines.map((line) => {
              const product = shopProducts().find((item) => item.id === line.productId);
              return (
                <li key={`${line.productId}-${line.size}`} className="flex items-center justify-between gap-3 text-sm text-ozora-cream">
                  <span>
                    {line.quantity} × {product?.name} · {sizeLabel(line.size, language)}
                  </span>
                  <button
                    type="button"
                    className="text-ozora-pink"
                    onClick={() => setLines((current) => current.filter((item) => item.productId !== line.productId || item.size !== line.size))}
                  >
                    {shopText(language, 'remove')}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(['name', 'line1', 'city', 'postalCode', 'country'] as const).map((field) => (
              <label key={field} className="text-sm text-ozora-cream">
                {shopText(language, field)}
                <input
                  className="mt-1 block w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2"
                  value={address[field]}
                  onChange={(event) => setField(field, event.target.value)}
                />
              </label>
            ))}
          </div>
          <p className="mt-4 text-sm font-semibold text-ozora-cream">
            {shopText(language, 'total')} €{shopTotal(lines)}
          </p>
          {buyHref ? (
            <a href={buyHref} target="_blank" rel="noreferrer noopener" className="mt-4 inline-flex rounded-xl bg-ozora-green px-5 py-3 text-sm font-bold text-ozora-cream">
              {shopText(language, 'buy')}
            </a>
          ) : (
            <button type="button" disabled className="mt-4 inline-flex cursor-not-allowed rounded-xl bg-white/10 px-5 py-3 text-sm font-bold text-ozora-cream/50">
              {shopText(language, 'buy')}
            </button>
          )}
          <p className="mt-3 text-xs text-ozora-cream/60">{shopText(language, 'note')}</p>
        </div>
      </div>
    </section>
  );
}
