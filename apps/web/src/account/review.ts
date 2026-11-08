import { normalizeAccountEmail, passwordProblem, usernameProblem } from 'tropical-nomads-shared';
import type { AccountNotice } from '../i18n/copy';

export interface RegistrationInput {
  email: string;
  username: string;
  givenName: string;
  familyName: string;
  password: string;
}

export function reviewRegistration(input: RegistrationInput, existingUsernames: readonly string[], eventIds: readonly string[]): AccountNotice | undefined {
  const email = normalizeAccountEmail(input.email);
  if (!email.includes('@') || email.startsWith('@') || email.endsWith('@')) {
    return 'email-invalid';
  }
  if (input.givenName.trim() === '' || input.familyName.trim() === '') {
    return 'name-required';
  }
  const username = usernameProblem(input.username, existingUsernames, eventIds);
  if (username === 'username is required') {
    return 'username-required';
  }
  if (username === 'username is taken') {
    return 'username-taken';
  }
  if (username === 'username is not valid') {
    return 'username-invalid';
  }
  return passwordNotice(passwordProblem(input.password, input.username, email));
}

export function reviewPasswordSignIn(email: string, password: string): AccountNotice | undefined {
  const normalized = normalizeAccountEmail(email);
  if (!normalized.includes('@') || normalized.startsWith('@') || normalized.endsWith('@')) {
    return 'email-invalid';
  }
  return passwordNotice(passwordProblem(password, '', normalized));
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
    case 'password is not allowed':
      return 'password-rejected';
    default:
      return 'password-rejected';
  }
}
