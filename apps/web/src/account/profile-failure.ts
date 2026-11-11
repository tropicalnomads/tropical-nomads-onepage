import type { AccountNotice } from '../i18n/copy';

/** Profile save stays on the profile form. A thrown request is not a sign-in failure. */
export function noticeForProfileFailure(error: unknown): AccountNotice {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  if (message === 'payload is too large' || message === 'avatar is too large' || message.includes('413') || message.includes('Body exceeded')) {
    return 'avatar-too-large';
  }
  if (message === 'avatar is not an image') {
    return 'avatar-rejected';
  }
  return 'profile-save-failed';
}
