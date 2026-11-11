'use server';

import { avatarByteLimit } from 'tropical-nomads-shared';
import { saveAvatarFile, updateAccounts } from 'tropical-nomads-api/accounts';
import { apiOrigin } from '../api-origin.ts';
import type { AccountNotice } from '../i18n/copy';
import { callPrivate } from '../remote-store.ts';
import { currentAccountSub } from './actions';
import { noticeForProfileFailure } from './profile-failure';

export interface AvatarActionResult {
  notice: AccountNotice;
}

const blockedFields = new Set(['userId', 'sub', 'avatarKey', 'role', 'secret', 'password']);

export async function saveAvatarAction(formData: FormData): Promise<AvatarActionResult> {
  for (const key of formData.keys()) {
    if (blockedFields.has(key)) {
      return { notice: 'avatar-rejected' };
    }
  }
  const sub = await currentAccountSub();
  if (!sub) {
    return { notice: 'not-signed-in' };
  }
  const file = formData.get('avatar');
  if (!(file instanceof File) || file.size < 12) {
    return { notice: 'avatar-rejected' };
  }
  if (file.size > avatarByteLimit) {
    return { notice: 'avatar-too-large' };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    if (apiOrigin()) {
      await callPrivate('save-avatar', { sub, avatarBase64: Buffer.from(bytes).toString('base64') });
    } else {
      await updateAccounts((current) => saveAvatarFile(current, sub, bytes, new Date().toISOString()));
    }
  } catch (error) {
    return { notice: noticeForProfileFailure(error) };
  }
  return { notice: 'avatar-saved' };
}
