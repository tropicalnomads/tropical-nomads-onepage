'use client';

import { useState, type FormEvent } from 'react';
import { sizeLabel } from '../../../one-pager/src/lib/shop.ts';
import { saveShopProductAction, type ShopProductNotice } from '../admin/shop-actions';
import { shopSizeCodes, type ShopProductValues } from '../admin/shop-values';
import { shopText } from '../i18n/shop-copy';
import { useLanguage } from '../i18n/provider';

const fieldClass = 'w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-ozora-cream';

export function AdminShopForm({ values }: { values: ShopProductValues }) {
  const { language } = useLanguage();
  const [result, setResult] = useState<ShopProductNotice | null>(null);
  const [pending, setPending] = useState(false);
  const creating = values.id === '';

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setPending(true);
    setResult(null);
    try {
      const saved = await saveShopProductAction(new FormData(event.currentTarget));
      setResult(saved);
      if (saved.notice === 'saved') {
        window.location.assign(`/admin/shop/${saved.id}`);
        return;
      }
    } catch {
      setResult({ notice: 'invalid' });
    }
    setPending(false);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <a href="/shop" className="text-sm font-semibold text-ozora-turquoise">
        {shopText(language, 'backShop')}
      </a>
      <h1 className="mt-3 text-2xl font-bold text-ozora-cream md:text-3xl">{shopText(language, creating ? 'addProduct' : 'editProduct')}</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
        <label className="block text-sm text-ozora-cream">
          {shopText(language, 'titleLabel')}
          <input name="name" required maxLength={80} defaultValue={values.name} className={`${fieldClass} mt-1`} />
        </label>
        <label className="block text-sm text-ozora-cream">
          {shopText(language, 'textEn')}
          <textarea name="descriptionEn" required maxLength={600} rows={4} defaultValue={values.descriptionEn} className={`${fieldClass} mt-1`} />
        </label>
        <label className="block text-sm text-ozora-cream">
          {shopText(language, 'textPt')}
          <textarea name="descriptionPt" required maxLength={600} rows={4} defaultValue={values.descriptionPt} className={`${fieldClass} mt-1`} />
        </label>
        <label className="block text-sm text-ozora-cream">
          {shopText(language, 'priceLabel')}
          <input name="amount" required inputMode="decimal" defaultValue={values.amount} placeholder="50" className={`${fieldClass} mt-1`} />
        </label>
        <fieldset>
          <legend className="text-sm font-semibold text-ozora-cream">{shopText(language, 'stockLabel')}</legend>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {shopSizeCodes.map((code) => (
              <label key={code} className="block text-sm text-ozora-cream">
                {sizeLabel(code, language)}
                <input name={`stock-${code}`} required inputMode="numeric" min={0} max={999} defaultValue={values.stock[code]} className={`${fieldClass} mt-1`} />
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm text-ozora-cream">
          {shopText(language, 'imageLabel')}
          {values.image ? <img src={values.image} alt="" className="mt-2 h-40 w-32 rounded-2xl border border-white/10 bg-ozora-cream/[0.04] object-contain p-2" /> : null}
          <input name="image" type="file" accept="image/jpeg,image/png,image/webp" required={creating} className={`${fieldClass} mt-2 file:mr-3 file:rounded-full file:border-0 file:bg-ozora-yellow file:px-3 file:py-1 file:text-xs file:font-bold file:text-ozora-ink`} />
          <span className="mt-1 block text-xs text-ozora-cream/55">{shopText(language, 'imageHelp')}</span>
          {creating ? null : <span className="mt-1 block text-xs text-ozora-cream/55">{shopText(language, 'keepImage')}</span>}
        </label>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center rounded-full bg-ozora-yellow px-5 text-sm font-bold text-ozora-ink transition hover:bg-ozora-coral disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-ozora-cream/40"
        >
          {shopText(language, 'saveProduct')}
        </button>
        {result?.notice === 'saved' ? <p className="text-sm text-emerald-300">{shopText(language, 'productSaved')}</p> : null}
        {result?.notice === 'invalid' || result?.notice === 'denied' ? <p className="text-sm text-ozora-coral">{shopText(language, 'productInvalid')}</p> : null}
      </form>
    </div>
  );
}
