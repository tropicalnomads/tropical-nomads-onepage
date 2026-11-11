'use server';

import { cookies } from 'next/headers';
import { avatarByteLimit } from 'tropical-nomads-shared';
import { saveAvatarFile, saveProfileDetails, updateAccounts, type ProfileDetails } from 'tropical-nomads-api/accounts';
import { apiOrigin } from '../api-origin.ts';
import type { AccountNotice } from '../i18n/copy';
import { callPrivate } from '../remote-store.ts';
import { noticeForProfileFailure } from './profile-failure';
import { cleanedProfileInput, firstProfileField, profileFieldIssues, profileInputFromFormData } from './profile-form';
import { readSessionSub, sessionCookieName } from './session';

export interface ProfileActionResult {
  notice?: AccountNotice;
  redirect?: '/account';
}

export async function readProfileDetails(formData: FormData): Promise<{ details?: ProfileDetails; notice?: AccountNotice }> {
  const input = profileInputFromFormData(formData);
  const issues = profileFieldIssues(input);
  if (issues.givenName === 'required' || issues.familyName === 'required') {
    return { notice: 'name-required' };
  }
  if (firstProfileField(issues)) {
    return { notice: 'profile-invalid' };
  }
  const values = cleanedProfileInput(input);
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
  if (file.size > avatarByteLimit) {
    return { notice: 'avatar-too-large' };
  }
  if (file.size < 12) {
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
    if (apiOrigin()) {
      await callPrivate('save-profile', {
        sub,
        details: parsed.details,
        requireSession: true,
        ...(bytes ? { avatarBase64: Buffer.from(bytes).toString('base64') } : {}),
      });
    } else {
      await updateAccounts((current) => {
        const withDetails = saveProfileDetails(current, sub, parsed.details!, now);
        return bytes ? saveAvatarFile(withDetails, sub, bytes, now) : withDetails;
      });
    }
  } catch (error) {
    return { notice: noticeForProfileFailure(error) };
  }
  return { notice: 'profile-saved', redirect: '/account' };
}
