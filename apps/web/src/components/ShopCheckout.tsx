'use client';

import { Check, Loader2, MapPin, UserRound } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { shopText } from '../i18n/shop-copy';
import { useLanguage } from '../i18n/provider';
import { publicHref } from '../seo/urls';
import { saveDeliveryAddressAction } from '../shop/actions';
import { shopAddressComplete, type ShopAddress } from '../shop/order';
import { canonicalCountryName, countryChoices, postalCompact, postalLookupKey } from '../shop/postal';
import { useShopCart } from '../shop/useShopCart';
import { SelectField } from './SelectField';
import { ShopSteps } from './ShopSteps';
import { Button } from './ui/Button';
import { fieldControlClass } from './ui/field';

const fieldClass = `${fieldControlClass} h-12 text-sm`;

type LookupStatus = 'idle' | 'loading' | 'found' | 'missing';

interface PostalFill {
  postal: string;
  city: string;
  region: string;
  country: string;
  line1: string;
}

interface PostalHit {
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  line1?: string;
}

export interface ShopAddressPreset {
  address: ShopAddress;
  kind: 'saved' | 'profile';
}

function withoutStaleFill(address: ShopAddress, fill: PostalFill | null): { address: ShopAddress; fill: PostalFill | null } {
  if (!fill || postalCompact(address.postalCode) === fill.postal) {
    return { address, fill };
  }
  return {
    fill: null,
    address: {
      ...address,
      city: address.city === fill.city ? '' : address.city,
      region: address.region === fill.region ? '' : address.region,
      country: address.country === fill.country ? '' : address.country,
      line1: fill.line1 !== '' && address.line1 === fill.line1 ? '' : address.line1,
    },
  };
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
  const requestToken = useRef(0);
  const postalEdited = useRef(false);
  const countryEdited = useRef(false);
  const filledFromLookup = useRef<PostalFill | null>(null);
  const cartRef = useRef(cart);
  cartRef.current = cart;
  const countries = useMemo(() => countryChoices(language), [language]);

  useEffect(() => {
    if (!cart.ready) {
      return;
    }
    const canonical = canonicalCountryName(cart.address.country);
    if (canonical === cart.address.country) {
      return;
    }
    cartRef.current.setAddress({ ...cartRef.current.address, country: canonical });
  }, [cart.ready, cart.address.country]);

  const lookupPostalCode = async (postalCode: string, country: string): Promise<void> => {
    const trimmed = postalCode.trim();
    if (trimmed.length < 3) {
      return;
    }
    const key = postalLookupKey(trimmed, country);
    if (lookupKey.current === key) {
      return;
    }
    const token = requestToken.current + 1;
    requestToken.current = token;
    lookupKey.current = key;
    setLookupStatus('loading');
    try {
      const params = new URLSearchParams({ postalCode: trimmed });
      if (country.trim() !== '') {
        params.set('country', country.trim());
      }
      const response = await fetch(`/shop/postal-lookup?${params}`);
      if (token !== requestToken.current) {
        return;
      }
      const latest = cartRef.current.address;
      if (postalCompact(latest.postalCode) !== postalCompact(trimmed)) {
        return;
      }
      if (!response.ok) {
        const cleared = withoutStaleFill(latest, filledFromLookup.current);
        filledFromLookup.current = cleared.fill;
        const next = { ...cleared.address, postalCode: latest.postalCode };
        lookupKey.current = postalLookupKey(next.postalCode, next.country);
        if (next.city !== latest.city || next.region !== latest.region || next.country !== latest.country || next.line1 !== latest.line1) {
          cartRef.current.setAddress(next);
        }
        setLookupStatus('missing');
        return;
      }
      const found = (await response.json()) as PostalHit;
      const cleared = withoutStaleFill(latest, filledFromLookup.current);
      const nextPostal = found.postalCode?.trim() || latest.postalCode;
      const nextCountry = found.country?.trim() || cleared.address.country;
      const city = found.city?.trim() || cleared.address.city;
      const region = found.region?.trim() || cleared.address.region;
      const line1 = cleared.address.line1.trim() !== '' ? cleared.address.line1 : found.line1?.trim() || '';
      filledFromLookup.current = { postal: postalCompact(nextPostal), city, region, country: nextCountry, line1: found.line1?.trim() ? line1 : '' };
      lookupKey.current = postalLookupKey(nextPostal, nextCountry);
      cartRef.current.setAddress({
        ...cleared.address,
        city,
        region,
        country: nextCountry,
        line1,
        postalCode: nextPostal,
      });
      setLookupStatus('found');
    } catch {
      if (token === requestToken.current) {
        lookupKey.current = '';
        setLookupStatus('missing');
      }
    }
  };

  const lookupRef = useRef(lookupPostalCode);
  lookupRef.current = lookupPostalCode;

  useEffect(() => {
    if (!cart.ready) {
      return;
    }
    const postalCode = cart.address.postalCode;
    const country = canonicalCountryName(cart.address.country);
    if (postalCode.trim().length < 3) {
      return;
    }
    const key = postalLookupKey(postalCode, country);
    if (lookupKey.current === key) {
      return;
    }
    const needsFill = cart.address.city.trim() === '' || country === '';
    if (!postalEdited.current && !countryEdited.current && !needsFill) {
      lookupKey.current = key;
      return;
    }
    const timer = window.setTimeout(() => {
      void lookupRef.current(postalCode, country);
    }, postalEdited.current || countryEdited.current ? 450 : 0);
    return () => window.clearTimeout(timer);
  }, [cart.ready, cart.address.postalCode, cart.address.country]);

  if (!cart.ready) {
    return <section className="min-h-[50vh] px-5 py-10 md:px-8 md:py-14" />;
  }
  const complete = shopAddressComplete(cart.address);

  const setField = (field: keyof ShopAddress, value: string): void => {
    const address: ShopAddress = { ...cart.address, [field]: value };
    if (field === 'postalCode') {
      postalEdited.current = true;
      if (postalCompact(cart.address.postalCode) !== postalCompact(value)) {
        lookupKey.current = '';
        setLookupStatus('idle');
      }
    }
    if (field === 'country') {
      countryEdited.current = true;
      if (canonicalCountryName(cart.address.country).toLowerCase() !== canonicalCountryName(value).toLowerCase()) {
        lookupKey.current = '';
        setLookupStatus('idle');
      }
    }
    cart.setAddress(address);
  };

  const usePreset = (preset: ShopAddressPreset): void => {
    const merged = { ...cart.address };
    for (const key of Object.keys(preset.address) as (keyof ShopAddress)[]) {
      if (preset.address[key].trim() !== '') {
        merged[key] = preset.address[key];
      }
    }
    const matchKey = postalLookupKey(merged.postalCode, merged.country);
    const needsFill = merged.postalCode.trim().length >= 3 && (merged.city.trim() === '' || merged.country.trim() === '');
    lookupKey.current = needsFill ? '' : matchKey;
    postalEdited.current = needsFill;
    countryEdited.current = false;
    filledFromLookup.current = null;
    setLookupStatus('idle');
    cart.setAddress(merged);
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
            <Button href={publicHref('/shop', language)} className="mt-6">
              {shopText(language, 'continue')}
            </Button>
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
                  <Button type="button" tone="ghost" size="sm" className="mt-4 w-full" onClick={() => usePreset(preset)}>
                    {shopText(language, 'useAddress')}
                  </Button>
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
                  {shopText(language, 'name')}
                  <input className={fieldClass} name="name" value={cart.address.name} autoComplete="name" onChange={(event) => setField('name', event.target.value)} />
                </label>
                <div className="grid gap-1.5 sm:col-span-2 sm:max-w-xs">
                  <label htmlFor="shop-postal-code" className="text-sm font-semibold text-ozora-cream/80">
                    {shopText(language, 'postalCode')}
                  </label>
                  <div className="relative">
                    <input
                      id="shop-postal-code"
                      className={`${fieldClass} pr-11`}
                      name="postalCode"
                      value={cart.address.postalCode}
                      autoComplete="postal-code"
                      aria-busy={lookupStatus === 'loading'}
                      onBlur={() => void lookupPostalCode(cart.address.postalCode, cart.address.country)}
                      onChange={(event) => setField('postalCode', event.target.value)}
                    />
                    {lookupStatus === 'loading' ? (
                      <Loader2 className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-ozora-turquoise" size={16} aria-hidden="true" />
                    ) : null}
                    {lookupStatus === 'found' ? (
                      <Check className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-300" size={16} aria-hidden="true" />
                    ) : null}
                  </div>
                  <p className="sr-only" role="status">
                    {lookupStatus === 'loading' ? shopText(language, 'lookingUp') : null}
                    {lookupStatus === 'found' ? shopText(language, 'lookupFound') : null}
                  </p>
                  {lookupStatus === 'missing' ? <p className="text-xs text-ozora-coral">{shopText(language, 'lookupMissing')}</p> : null}
                </div>
                <label className="grid gap-1.5 text-sm font-semibold text-ozora-cream/80 sm:col-span-2">
                  {shopText(language, 'line1')}
                  <input className={fieldClass} name="line1" value={cart.address.line1} autoComplete="address-line1" onChange={(event) => setField('line1', event.target.value)} />
                </label>
                <label className="grid gap-1.5 text-sm font-semibold text-ozora-cream/80 sm:col-span-2">
                  {shopText(language, 'line2')}
                  <input className={fieldClass} name="line2" value={cart.address.line2} autoComplete="address-line2" onChange={(event) => setField('line2', event.target.value)} />
                </label>
                <label className="grid gap-1.5 text-sm font-semibold text-ozora-cream/80">
                  {shopText(language, 'city')}
                  <input className={fieldClass} name="city" value={cart.address.city} autoComplete="address-level2" onChange={(event) => setField('city', event.target.value)} />
                </label>
                <label className="grid gap-1.5 text-sm font-semibold text-ozora-cream/80">
                  {shopText(language, 'region')}
                  <input className={fieldClass} name="region" value={cart.address.region} autoComplete="address-level1" onChange={(event) => setField('region', event.target.value)} />
                </label>
                <label className="grid gap-1.5 text-sm font-semibold text-ozora-cream/80 sm:col-span-2">
                  {shopText(language, 'country')}
                  <SelectField
                    name="country"
                    ariaLabel={shopText(language, 'country')}
                    value={canonicalCountryName(cart.address.country)}
                    placeholder={shopText(language, 'selectCountry')}
                    searchable
                    searchPlaceholder={shopText(language, 'searchCountry')}
                    emptyLabel={shopText(language, 'noCountryMatches')}
                    onChange={(next) => setField('country', next)}
                    options={countries}
                  />
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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button href={publicHref('/shop', language)} tone="ghost">
                    {shopText(language, 'continue')}
                  </Button>
                  <Button href="/shop/cart" tone="back">
                    {shopText(language, 'backCart')}
                  </Button>
                </div>
                <Button type="button" disabled={!complete || submitting} onClick={() => void continueCheckout()}>
                  {shopText(language, 'next')}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
