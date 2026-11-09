import { normalizeAccountEmail, passwordProblem } from 'tropical-nomads-shared';
import type { AccountNotice } from '../i18n/copy';

export interface RegistrationInput {
  email: string;
  password: string;
  confirmPassword: string;
}

export function reviewRegistration(input: RegistrationInput): AccountNotice | undefined {
  const emailNotice = reviewEmail(input.email);
  if (emailNotice) {
    return emailNotice;
  }
  if (input.password !== input.confirmPassword) {
    return 'password-mismatch';
  }
  return passwordNotice(passwordProblem(input.password, '', normalizeAccountEmail(input.email)));
}

export function reviewProfileNames(givenName: string, familyName: string): AccountNotice | undefined {
  if (givenName.trim() === '' || familyName.trim() === '' || givenName.trim().length > 80 || familyName.trim().length > 80) {
    return 'name-required';
  }
  return undefined;
}

export const pendingEmailCookie = 'tn:pending-email';

export function reviewEmail(email: string): AccountNotice | undefined {
  const normalized = normalizeAccountEmail(email);
  if (!normalized.includes('@') || normalized.startsWith('@') || normalized.endsWith('@') || normalized.includes(' ')) {
    return 'email-invalid';
  }
  return undefined;
}

export function accountEmail(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const email = normalizeAccountEmail(value);
  return reviewEmail(email) ? undefined : email;
}

export function reviewPasswordSignIn(email: string, password: string): AccountNotice | undefined {
  const emailNotice = reviewEmail(email);
  if (emailNotice) {
    return emailNotice;
  }
  return passwordNotice(passwordProblem(password, '', normalizeAccountEmail(email)));
}

export function reviewConfirmationCode(code: string): AccountNotice | undefined {
  if (!/^[0-9]{4,8}$/.test(code.trim())) {
    return 'code-invalid';
  }
  return undefined;
}

export function reviewProvider(provider: string): AccountNotice {
  if (provider !== 'google' && provider !== 'apple') {
    return 'provider-not-allowed';
  }
  return 'cognito-not-configured';
}

function passwordNotice(problem: string | undefined): AccountNotice | undefined {
  switch (problem) {
    case undefined:
      return undefined;
    case 'password is too short':
      return 'password-short';
    case 'password is too long':
      return 'password-long';
    case 'password needs an uppercase letter':
      return 'password-uppercase';
    case 'password needs a lowercase letter':
      return 'password-lowercase';
    case 'password needs a number':
      return 'password-number';
    case 'password needs a symbol':
      return 'password-symbol';
    case 'password is not allowed':
      return 'password-rejected';
    default:
      return 'password-rejected';
  }
}
