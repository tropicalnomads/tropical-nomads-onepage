'use client';

import { AtSign, Camera, Globe2, MapPin, Phone, User, Warehouse } from 'lucide-react';
import { useEffect, useState, type ChangeEvent } from 'react';
import { accountText } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';
import { AuthField } from './AuthUi';

export interface ProfileValues {
  givenName: string;
  familyName: string;
  displayName?: string;
  phone?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  hasAvatar?: boolean;
}

function requiredLabel(label: string, badge: string) {
  return (
    <span className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className="rounded-full border border-ozora-yellow/30 bg-ozora-yellow/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ozora-yellow">
        {badge}
      </span>
    </span>
  );
}

export function ProfileFields({
  values,
  pending,
}: {
  values?: Partial<ProfileValues>;
  pending: boolean;
}) {
  const { language } = useLanguage();
  const [preview, setPreview] = useState<string>();

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function previewAvatar(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    setPreview((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return file ? URL.createObjectURL(file) : undefined;
    });
  }

  const avatarSrc = preview ?? (values?.hasAvatar ? '/account/avatar' : undefined);
  const initial = (values?.displayName || values?.givenName || '?').trim().slice(0, 1).toUpperCase();
  const requiredText = accountText(language, 'required');

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-gradient-to-br from-ozora-turquoise/30 to-ozora-pink/25 text-3xl font-bold text-ozora-cream shadow-[0_12px_32px_rgba(0,0,0,0.28)]">
            {avatarSrc ? <img src={avatarSrc} alt="" className="h-full w-full object-cover" /> : <span>{initial}</span>}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="font-bold text-ozora-cream">{accountText(language, 'avatarTitle')}</h2>
            <p className="mt-1 text-sm leading-relaxed text-ozora-cream/60">{accountText(language, 'avatarHelp')}</p>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-bold text-ozora-cream transition hover:border-ozora-turquoise/50 hover:bg-ozora-turquoise/10 focus-within:ring-2 focus-within:ring-ozora-turquoise">
              <Camera size={17} aria-hidden="true" />
              {accountText(language, 'avatarChoose')}
              <input
                name="avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={pending}
                onChange={previewAvatar}
                className="sr-only"
              />
            </label>
          </div>
        </div>
      </section>

      <div>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-ozora-cream">{accountText(language, 'profileDetailsTitle')}</h2>
          <p className="mt-1 text-sm leading-relaxed text-ozora-cream/60">{accountText(language, 'profileDetailsHelp')}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <AuthField
            label={requiredLabel(accountText(language, 'givenName'), requiredText)}
            name="givenName"
            icon={User}
            autoComplete="given-name"
            required
            disabled={pending}
            defaultValue={values?.givenName}
            maxLength={80}
          />
          <AuthField
            label={requiredLabel(accountText(language, 'familyName'), requiredText)}
            name="familyName"
            icon={User}
            autoComplete="family-name"
            required
            disabled={pending}
            defaultValue={values?.familyName}
            maxLength={80}
          />
          <AuthField
            label={accountText(language, 'displayName')}
            name="displayName"
            icon={AtSign}
            autoComplete="nickname"
            disabled={pending}
            defaultValue={values?.displayName}
            maxLength={80}
          />
          <AuthField
            label={accountText(language, 'phone')}
            name="phone"
            icon={Phone}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            disabled={pending}
            defaultValue={values?.phone}
            maxLength={16}
            placeholder="+353…"
          />
          <AuthField
            label={accountText(language, 'city')}
            name="city"
            icon={MapPin}
            autoComplete="address-level2"
            disabled={pending}
            defaultValue={values?.city}
            maxLength={100}
          />
          <AuthField
            label={accountText(language, 'region')}
            name="region"
            icon={Warehouse}
            autoComplete="address-level1"
            disabled={pending}
            defaultValue={values?.region}
            maxLength={100}
          />
          <AuthField
            label={accountText(language, 'postalCode')}
            name="postalCode"
            icon={MapPin}
            autoComplete="postal-code"
            disabled={pending}
            defaultValue={values?.postalCode}
            maxLength={24}
          />
          <AuthField
            label={accountText(language, 'country')}
            name="country"
            icon={Globe2}
            autoComplete="country-name"
            disabled={pending}
            defaultValue={values?.country}
            maxLength={100}
          />
        </div>
      </div>
    </div>
  );
}
