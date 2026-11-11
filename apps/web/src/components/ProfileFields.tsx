'use client';

import { AtSign, Globe2, MapPin, Phone, User, Warehouse } from 'lucide-react';
import { useRef, useState } from 'react';
import { accountText, type AccountNotice } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';
import { avatarCropSize } from '../shop/crop-image';
import { CroppedImageField } from './admin/CroppedImageField';
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
  onNotice,
}: {
  values?: Partial<ProfileValues>;
  pending: boolean;
  onNotice?: (notice: AccountNotice | null) => void;
}) {
  const { language } = useLanguage();
  const [preview, setPreview] = useState<string>();
  const avatarRef = useRef<HTMLInputElement>(null);
  const savedAvatar = values?.hasAvatar ? '/account/avatar' : undefined;
  const requiredText = accountText(language, 'required');

  function assignAvatar(file: File | undefined): void {
    const input = avatarRef.current;
    if (!input) {
      return;
    }
    const transfer = new DataTransfer();
    if (file) {
      transfer.items.add(file);
    }
    input.files = transfer.files;
  }

  return (
    <div className="space-y-8">
      <CroppedImageField
        preview={preview ?? savedAvatar}
        aspect={1}
        aspectClass="aspect-square"
        output={avatarCropSize}
        fileName="avatar.webp"
        disabled={pending}
        labels={{
          title: accountText(language, 'avatarTitle'),
          ratio: accountText(language, 'avatarRatio'),
          remove: accountText(language, 'avatarRemove'),
          noImage: accountText(language, 'avatarEmpty'),
          placeholder: accountText(language, 'avatarPlaceholder'),
          replace: accountText(language, 'avatarReplace'),
          upload: accountText(language, 'avatarChoose'),
          help: accountText(language, 'avatarHelp'),
          invalid: accountText(language, 'avatarInvalid'),
          cropTitle: accountText(language, 'avatarCropTitle'),
          cropHelp: accountText(language, 'avatarCropHelp'),
          cancel: accountText(language, 'avatarCancel'),
          zoom: accountText(language, 'avatarZoom'),
          cropping: accountText(language, 'avatarCropping'),
          use: accountText(language, 'avatarUse'),
        }}
        onInvalid={(reason) => onNotice?.(reason === 'too-large' ? 'avatar-too-large' : 'avatar-rejected')}
        onChange={(next) => {
          onNotice?.(null);
          if (next.removed) {
            setPreview(undefined);
            assignAvatar(undefined);
            return;
          }
          setPreview(next.preview);
          assignAvatar(next.file);
        }}
      />
      <input ref={avatarRef} name="avatar" type="file" tabIndex={-1} aria-hidden="true" className="sr-only" />

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
