'use server';

import { cookies } from 'next/headers';
import { saveAvatarFile, saveProfileDetails, updateAccounts, type ProfileDetails } from 'tropical-nomads-api/accounts';
import type { AccountNotice } from '../i18n/copy';
import { readSessionSub, sessionCookieName } from './session';

export interface ProfileActionResult {
  notice?: AccountNotice;
  redirect?: '/account';
}

const fieldLimits = {
  givenName: 80,
  familyName: 80,
  displayName: 80,
  phone: 16,
  city: 100,
  region: 100,
  postalCode: 24,
  country: 100,
} as const;

function text(formData: FormData, key: keyof typeof fieldLimits): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

export async function readProfileDetails(formData: FormData): Promise<{ details?: ProfileDetails; notice?: AccountNotice }> {
  const values = Object.fromEntries(
    Object.keys(fieldLimits).map((key) => [key, text(formData, key as keyof typeof fieldLimits)]),
  ) as Record<keyof typeof fieldLimits, string>;
  if (values.givenName === '' || values.familyName === '') {
    return { notice: 'name-required' };
  }
  for (const [key, limit] of Object.entries(fieldLimits) as [keyof typeof fieldLimits, number][]) {
    if (values[key].length > limit) {
      return { notice: 'profile-invalid' };
    }
  }
  if (values.phone !== '' && !/^\+[1-9]\d{1,14}$/.test(values.phone)) {
    return { notice: 'profile-invalid' };
  }
  const details: ProfileDetails = {
    givenName: values.givenName,
    familyName: values.familyName,
  };
  for (const key of ['displayName', 'phone', 'city', 'region', 'postalCode', 'country'] as const) {
    if (values[key] !== '') {
      details[key] = values[key];
    }
  }
  const file = formData.get('avatar');
  if (!(file instanceof File) || file.size === 0) {
    return { details };
  }
  if (file.size < 12 || file.size > 1_000_000) {
    return { notice: 'avatar-rejected' };
  }
  return { details };
}

export async function readProfileAvatar(formData: FormData): Promise<Uint8Array | undefined> {
  const file = formData.get('avatar');
  if (!(file instanceof File) || file.size === 0) {
    return undefined;
  }
  return new Uint8Array(await file.arrayBuffer());
}

export async function saveAccountProfileAction(formData: FormData): Promise<ProfileActionResult> {
  const parsed = await readProfileDetails(formData);
  if (!parsed.details || parsed.notice) {
    return { notice: parsed.notice ?? 'profile-invalid' };
  }
  const jar = await cookies();
  const sub = readSessionSub(jar.get(sessionCookieName)?.value);
  if (!sub) {
    return { notice: 'not-signed-in' };
  }
  const bytes = await readProfileAvatar(formData);
  const now = new Date().toISOString();
  try {
    await updateAccounts((current) => {
      const withDetails = saveProfileDetails(current, sub, parsed.details!, now);
      return bytes ? saveAvatarFile(withDetails, sub, bytes, now) : withDetails;
    });
  } catch {
    return { notice: bytes ? 'avatar-rejected' : 'profile-invalid' };
  }
  return { notice: 'profile-saved', redirect: '/account' };
}
