'use client';

import { Check, MapPin, Search, UserRound } from 'lucide-react';
import { useRef, useState } from 'react';
import type { Locale } from 'tropical-nomads-shared';
import { shopText } from '../i18n/shop-copy';
import { useLanguage } from '../i18n/provider';
import { saveDeliveryAddressAction } from '../shop/actions';
import { shopAddressComplete, type ShopAddress } from '../shop/order';
import { useShopCart } from '../shop/useShopCart';
import { SelectField } from './SelectField';
import { ShopSteps } from './ShopSteps';

const fieldClass =
  'h-12 w-full rounded-xl border border-white/15 bg-black/25 px-4 text-sm text-ozora-cream outline-none transition placeholder:text-ozora-cream/35 focus:border-ozora-yellow focus:ring-2 focus:ring-ozora-yellow/15';

const countries = ['Ireland', 'Portugal', 'United Kingdom', 'Germany'] as const;
type Country = (typeof countries)[number];

type LookupStatus = 'idle' | 'loading' | 'found' | 'missing';

export interface ShopAddressPreset {
  address: ShopAddress;
  kind: 'saved' | 'profile';
}

function countryLabel(language: Locale, country: Country): string {
  switch (country) {
    case 'Ireland':
      return shopText(language, 'ireland');
    case 'Portugal':
      return shopText(language, 'portugal');
    case 'United Kingdom':
      return shopText(language, 'unitedKingdom');
    case 'Germany':
      return shopText(language, 'germany');
    default: {
      const unexpected: never = country;
      return unexpected;
    }
  }
}

function addressSummary(address: ShopAddress): string {
  return [address.name, address.line1, address.city, address.postalCode, address.country].filter((value) => value.trim() !== '').join(', ');
}

export function ShopCheckout({ presets, signedIn }: { presets: ShopAddressPreset[]; signedIn: boolean }) {
  const { language } = useLanguage();
  const cart = useShopCart();
  const [saveAddress, setSaveAddress] = useState(signedIn);
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle');
  const [submitting, setSubmitting] = useState(false);
  const lookupKey = useRef('');
  if (!cart.ready) {
    return <section className="min-h-[50vh] px-5 py-10 md:px-8 md:py-14" />;
  }
  const complete = shopAddressComplete(cart.address);

  const setField = (field: keyof ShopAddress, value: string): void => {
    const address: ShopAddress = { ...cart.address, [field]: value };
    cart.setAddress(address);
    if (field === 'postalCode' || field === 'country') {
      setLookupStatus('idle');
      lookupKey.current = '';
    }
  };

  const usePreset = (preset: ShopAddressPreset): void => {
    const merged = { ...cart.address };
    for (const key of Object.keys(preset.address) as (keyof ShopAddress)[]) {
      if (preset.address[key].trim() !== '') {
        merged[key] = preset.address[key];
      }
    }
    cart.setAddress(merged);
  };

  const lookupPostalCode = async (): Promise<void> => {
    const postalCode = cart.address.postalCode.trim();
    const country = cart.address.country.trim();
    const key = `${country}:${postalCode}`;
    if (postalCode.length < 3 || country === '' || lookupKey.current === key) {
      return;
    }
    lookupKey.current = key;
    setLookupStatus('loading');
    try {
      const query = new URLSearchParams({ country, postalCode });
      const response = await fetch(`/shop/postal-lookup?${query}`);
      if (!response.ok) {
        setLookupStatus('missing');
        return;
      }
      const found = (await response.json()) as { city?: string; region?: string; postalCode?: string };
      cart.setAddress({
        ...cart.address,
        city: found.city?.trim() || cart.address.city,
        region: found.region?.trim() || cart.address.region,
        postalCode: found.postalCode?.trim() || cart.address.postalCode,
      });
      setLookupStatus('found');
    } catch {
      setLookupStatus('missing');
    }
  };

  const continueCheckout = async (): Promise<void> => {
    if (!complete || submitting) {
      return;
    }
    setSubmitting(true);
    if (saveAddress && signedIn) {
      const data = new FormData();
      for (const [key, value] of Object.entries(cart.address)) {
        data.set(key, value);
      }
      await saveDeliveryAddressAction(data);
    }
    window.location.assign('/shop/checkout/review');
  };

  return (
    <section className="px-5 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-ozora-yellow">{shopText(language, 'checkout')}</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ozora-cream">{shopText(language, 'delivery')}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ozora-cream/65">{shopText(language, 'addressIntro')}</p>
        <ShopSteps current="address" />
        {cart.lines.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-ozora-navy/55 p-8 text-center">
            <p className="text-sm text-ozora-cream/75">{shopText(language, 'empty')}</p>
            <a
              href="/shop"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-ozora-yellow px-5 text-sm font-bold text-ozora-ink transition hover:bg-ozora-coral"
            >
              {shopText(language, 'continue')}
            </a>
          </div>
        ) : (
          <div className="mt-8 grid items-start gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
            <aside className="space-y-3">
              {presets.map((preset) => (
                <div key={preset.kind} className="rounded-3xl border border-white/10 bg-ozora-navy/55 p-4">
                  <div className="flex items-center gap-2 text-ozora-yellow">
                    {preset.kind === 'saved' ? <MapPin size={17} aria-hidden="true" /> : <UserRound size={17} aria-hidden="true" />}
                    <h2 className="text-sm font-bold">
                      {shopText(language, preset.kind === 'saved' ? 'savedAddress' : 'profileAddress')}
                    </h2>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ozora-cream/65">{addressSummary(preset.address)}</p>
                  <button
                    type="button"
                    onClick={() => usePreset(preset)}
                    className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-full border border-white/15 text-xs font-bold text-ozora-cream transition hover:border-ozora-turquoise hover:bg-white/5"
                  >
                    {shopText(language, 'useAddress')}
                  </button>
                </div>
              ))}
              {presets.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.025] p-4 text-sm leading-relaxed text-ozora-cream/55">
                  <MapPin className="mb-3 text-ozora-turquoise" size={20} aria-hidden="true" />
                  {signedIn ? shopText(language, 'saveAddressHelp') : shopText(language, 'addressIntro')}
                </div>
              ) : null}
            </aside>

            <form className="rounded-3xl border border-white/10 bg-ozora-navy/55 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:p-7" onSubmit={(event) => event.preventDefault()}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-semibold text-ozora-cream/80 sm:col-span-2">
                  {shopText(language, 'country')}
                  <SelectField
                    name="country"
                    ariaLabel={shopText(language, 'country')}
                    value={cart.address.country}
                    placeholder={shopText(language, 'selectCountry')}
                    onChange={(next) => setField('country', next)}
                    options={countries.map((country) => ({ value: country, label: countryLabel(language, country) }))}
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-semibold text-ozora-cream/80 sm:col-span-2">
                  {shopText(language, 'name')}
                  <input className={fieldClass} name="name" value={cart.address.name} autoComplete="name" onChange={(event) => setField('name', event.target.value)} />
                </label>
                <label className="grid gap-1.5 text-sm font-semibold text-ozora-cream/80 sm:col-span-2">
                  {shopText(language, 'line1')}
                  <input className={fieldClass} name="line1" value={cart.address.line1} autoComplete="address-line1" onChange={(event) => setField('line1', event.target.value)} />
                </label>
                <label className="grid gap-1.5 text-sm font-semibold text-ozora-cream/80 sm:col-span-2">
                  {shopText(language, 'line2')}
                  <input className={fieldClass} name="line2" value={cart.address.line2} autoComplete="address-line2" onChange={(event) => setField('line2', event.target.value)} />
                </label>
                <div className="grid gap-1.5 sm:col-span-2">
                  <label htmlFor="shop-postal-code" className="text-sm font-semibold text-ozora-cream/80">
                    {shopText(language, 'postalCode')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="shop-postal-code"
                      className={fieldClass}
                      name="postalCode"
                      value={cart.address.postalCode}
                      autoComplete="postal-code"
                      onBlur={() => void lookupPostalCode()}
                      onChange={(event) => setField('postalCode', event.target.value)}
                    />
                    <button
                      type="button"
                      disabled={lookupStatus === 'loading' || cart.address.country === '' || cart.address.postalCode.trim().length < 3}
                      onClick={() => void lookupPostalCode()}
                      className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-ozora-turquoise/40 bg-ozora-turquoise/10 px-4 text-xs font-bold text-ozora-turquoise transition hover:bg-ozora-turquoise/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-ozora-cream/30"
                    >
                      <Search size={15} aria-hidden="true" />
                      {shopText(language, lookupStatus === 'loading' ? 'lookingUp' : 'lookup')}
                    </button>
                  </div>
                  {lookupStatus === 'found' ? <p className="flex items-center gap-1.5 text-xs text-emerald-300"><Check size={13} aria-hidden="true" />{shopText(language, 'lookupFound')}</p> : null}
                  {lookupStatus === 'missing' ? <p className="text-xs text-ozora-coral">{shopText(language, 'lookupMissing')}</p> : null}
                  <p className="text-[11px] leading-relaxed text-ozora-cream/40">{shopText(language, 'lookupHelp')}</p>
                </div>
                <label className="grid gap-1.5 text-sm font-semibold text-ozora-cream/80">
                  {shopText(language, 'city')}
                  <input className={fieldClass} name="city" value={cart.address.city} autoComplete="address-level2" onChange={(event) => setField('city', event.target.value)} />
                </label>
                <label className="grid gap-1.5 text-sm font-semibold text-ozora-cream/80">
                  {shopText(language, 'region')}
                  <input className={fieldClass} name="region" value={cart.address.region} autoComplete="address-level1" onChange={(event) => setField('region', event.target.value)} />
                </label>
              </div>

              {signedIn ? (
                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/15 p-4">
                  <input type="checkbox" checked={saveAddress} onChange={(event) => setSaveAddress(event.target.checked)} className="mt-0.5 h-4 w-4 accent-ozora-yellow" />
                  <span>
                    <span className="block text-sm font-bold text-ozora-cream">{shopText(language, 'saveAddress')}</span>
                    <span className="mt-1 block text-xs text-ozora-cream/50">{shopText(language, 'saveAddressHelp')}</span>
                  </span>
                </label>
              ) : null}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <a href="/shop/cart" className="text-sm font-semibold text-ozora-turquoise hover:text-ozora-cream">
                  {shopText(language, 'backCart')}
                </a>
                <button
                  type="button"
                  disabled={!complete || submitting}
                  onClick={() => void continueCheckout()}
                  className="inline-flex h-12 items-center justify-center rounded-full bg-ozora-yellow px-7 text-sm font-bold text-ozora-ink transition hover:bg-ozora-coral disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-ozora-cream/40"
                >
                  {shopText(language, 'next')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
