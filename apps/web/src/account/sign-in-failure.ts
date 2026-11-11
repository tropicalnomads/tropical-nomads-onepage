import type { AccountNotice } from '../i18n/copy';

/** A thrown sign-in step stays on the server. The form shows one notice. */
export function noticeForSignInFailure(error: unknown): AccountNotice {
  void error;
  return 'sign-in-failed';
}
