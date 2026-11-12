'use client';

import { AtSign, Globe2, MapPin, Phone, User, Warehouse } from 'lucide-react';
import { useRef, useState } from 'react';
import { profileIssueCopyKey, type ProfileFieldIssue, type ProfileFieldIssues, type ProfileFieldName } from '../account/profile-form';
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

function fieldLabel(label: string, requiredText?: string) {
  if (!requiredText) {
    return label;
  }
  return (
    <span>
      {label}
      <abbr title={requiredText} className="ml-1 text-ozora-coral no-underline">
        *
      </abbr>
    </span>
  );
}

export function ProfileFields({
  values,
  pending,
  issues,
  onNotice,
  onClearIssue,
  initialPreview,
  onCleared,
}: {
  values?: Partial<ProfileValues>;
  pending: boolean;
  issues?: ProfileFieldIssues;
  onNotice?: (notice: AccountNotice | null) => void;
  onClearIssue?: (field: ProfileFieldName) => void;
  initialPreview?: string;
  onCleared?: () => void;
}) {
  const { language } = useLanguage();
  const [preview, setPreview] = useState<string | undefined>(initialPreview);
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

  function errorFor(field: ProfileFieldName): string | undefined {
    const issue: ProfileFieldIssue | undefined = issues?.[field];
    if (!issue) {
      return undefined;
    }
    return accountText(language, profileIssueCopyKey(field, issue));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <CroppedImageField
          preview={preview ?? savedAvatar}
          aspect={1}
          aspectClass="aspect-square"
          output={avatarCropSize}
          fileName="avatar.webp"
          disabled={pending}
          presentation="avatar"
          cropShape="round"
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
              onCleared?.();
              return;
            }
            setPreview(next.preview);
            assignAvatar(next.file);
          }}
        />
        <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
          <AuthField
            label={fieldLabel(accountText(language, 'givenName'), requiredText)}
            name="givenName"
            icon={User}
            autoComplete="given-name"
            required
            disabled={pending}
            defaultValue={values?.givenName}
            maxLength={80}
            error={errorFor('givenName')}
            onValueChange={() => onClearIssue?.('givenName')}
          />
          <AuthField
            label={fieldLabel(accountText(language, 'familyName'), requiredText)}
            name="familyName"
            icon={User}
            autoComplete="family-name"
            required
            disabled={pending}
            defaultValue={values?.familyName}
            maxLength={80}
            error={errorFor('familyName')}
            onValueChange={() => onClearIssue?.('familyName')}
          />
        </div>
      </div>
      <input ref={avatarRef} name="avatar" type="file" tabIndex={-1} aria-hidden="true" className="sr-only" />

      <div className="border-t border-white/10 pt-6">
        <div className="mb-4">
          <h2 className="text-base font-bold text-ozora-cream">{accountText(language, 'profileDetailsTitle')}</h2>
          <p className="mt-1 text-sm leading-relaxed text-ozora-cream/55">{accountText(language, 'profileDetailsHelp')}</p>
        </div>
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <AuthField
            label={accountText(language, 'displayName')}
            name="displayName"
            icon={AtSign}
            autoComplete="nickname"
            disabled={pending}
            defaultValue={values?.displayName}
            maxLength={80}
            error={errorFor('displayName')}
            onValueChange={() => onClearIssue?.('displayName')}
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
            maxLength={24}
            placeholder="+353871234567"
            error={errorFor('phone')}
            onValueChange={() => onClearIssue?.('phone')}
          />
          <AuthField
            label={accountText(language, 'city')}
            name="city"
            icon={MapPin}
            autoComplete="address-level2"
            disabled={pending}
            defaultValue={values?.city}
            maxLength={100}
            error={errorFor('city')}
            onValueChange={() => onClearIssue?.('city')}
          />
          <AuthField
            label={accountText(language, 'region')}
            name="region"
            icon={Warehouse}
            autoComplete="address-level1"
            disabled={pending}
            defaultValue={values?.region}
            maxLength={100}
            error={errorFor('region')}
            onValueChange={() => onClearIssue?.('region')}
          />
          <AuthField
            label={accountText(language, 'postalCode')}
            name="postalCode"
            icon={MapPin}
            autoComplete="postal-code"
            disabled={pending}
            defaultValue={values?.postalCode}
            maxLength={24}
            error={errorFor('postalCode')}
            onValueChange={() => onClearIssue?.('postalCode')}
          />
          <AuthField
            label={accountText(language, 'country')}
            name="country"
            icon={Globe2}
            autoComplete="country-name"
            disabled={pending}
            defaultValue={values?.country}
            maxLength={100}
            error={errorFor('country')}
            onValueChange={() => onClearIssue?.('country')}
          />
        </div>
      </div>
    </div>
  );
}
