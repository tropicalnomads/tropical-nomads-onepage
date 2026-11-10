import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { locales } from 'tropical-nomads-shared';
import { reviewConfirmationCode, reviewEmail, reviewPasswordSignIn, reviewProfileNames, reviewProvider, reviewRegistration } from '../src/account/review.ts';
import { createSessionToken, readSessionSub } from '../src/account/session.ts';
import { shellCopy, type AccountNotice } from '../src/i18n/copy.ts';

const notices: AccountNotice[] = [
  'username-required',
  'username-invalid',
  'username-taken',
  'name-required',
  'email-invalid',
  'password-short',
  'password-long',
  'password-uppercase',
  'password-lowercase',
  'password-number',
  'password-symbol',
  'password-mismatch',
  'password-rejected',
  'cognito-not-configured',
  'email-unconfirmed',
  'account-confirmed',
  'code-sent',
  'code-limited',
  'code-invalid',
  'reset-sent',
  'password-reset',
  'provider-not-allowed',
  'not-signed-in',
  'avatar-rejected',
  'avatar-saved',
  'profile-invalid',
  'profile-saved',
];

describe('accounts', () => {
  it('checks a registration before Cognito and does not accept a forged provider', () => {
    assert.equal(reviewRegistration({ email: 'not-an-email', password: 'Long-secret-1', confirmPassword: 'Long-secret-1' }), 'email-invalid');
    assert.equal(reviewRegistration({ email: 'ada@example.com', password: 'Long-secret-1', confirmPassword: 'Other-secret-1' }), 'password-mismatch');
    assert.equal(reviewRegistration({ email: 'ada@example.com', password: 'short', confirmPassword: 'short' }), 'password-short');
    assert.equal(reviewRegistration({ email: 'ada@example.com', password: 'long-secret-1', confirmPassword: 'long-secret-1' }), 'password-uppercase');
    assert.equal(reviewRegistration({ email: 'ada@example.com', password: 'Long-secret-1', confirmPassword: 'Long-secret-1' }), undefined);
    assert.equal(reviewProfileNames('', 'Lovelace'), 'name-required');
    assert.equal(reviewProfileNames('Ada', 'Lovelace'), undefined);
    assert.equal(reviewPasswordSignIn('ada@example.com', 'short'), 'password-short');
    assert.equal(reviewEmail('ada@example.com'), undefined);
    assert.equal(reviewEmail('not-an-email'), 'email-invalid');
    assert.equal(reviewConfirmationCode('123456'), undefined);
    assert.equal(reviewConfirmationCode('nope'), 'code-invalid');
    assert.equal(reviewProvider('google'), 'cognito-not-configured');
    assert.equal(reviewProvider('apple'), 'cognito-not-configured');
    assert.equal(reviewProvider('password'), 'provider-not-allowed');
  });

  it('rejects a tampered session and keeps the registration screen free of shop controls', () => {
    const token = createSessionToken('sub-ada', Date.parse('2026-11-08T18:00:00.000Z'));
    assert.equal(readSessionSub(token, Date.parse('2026-11-08T18:00:00.000Z')), 'sub-ada');
    assert.equal(readSessionSub(`${token}x`, Date.parse('2026-11-08T18:00:00.000Z')), undefined);
    assert.equal(readSessionSub(token, Date.parse('2026-11-09T18:00:00.000Z')), undefined);
    const register = readFileSync(new URL('../app/account/register/page.tsx', import.meta.url), 'utf8');
    const confirm = readFileSync(new URL('../app/account/confirm/page.tsx', import.meta.url), 'utf8');
    const forgot = readFileSync(new URL('../app/account/forgot-password/page.tsx', import.meta.url), 'utf8');
    const form = readFileSync(new URL('../src/components/AccountForms.tsx', import.meta.url), 'utf8');
    const authUi = readFileSync(new URL('../src/components/AuthUi.tsx', import.meta.url), 'utf8');
    const actions = readFileSync(new URL('../src/account/actions.ts', import.meta.url), 'utf8');
    const header = readFileSync(new URL('../src/components/ShellHeader.tsx', import.meta.url), 'utf8');
    assert.equal(register.includes('/shop'), false);
    assert.equal(register.includes('/check-in'), false);
    assert.equal(forgot.includes('/shop'), false);
    assert.equal(forgot.includes('/check-in'), false);
    assert.equal(form.includes('cardNumber'), false);
    assert.equal(form.includes('<PasswordField'), true);
    assert.equal(form.includes('name="confirmPassword"'), true);
    assert.equal(form.includes('PasswordGuide'), true);
    assert.equal(form.includes('name="username"'), false);
    assert.equal(actions.includes("'/account/profile'"), true);
    assert.equal(form.includes("data.set('provider', 'cognito')"), false);
    assert.equal(form.includes('confirmRegistrationAction'), true);
    const registerForm = form.slice(form.indexOf('export function RegisterForm'), form.indexOf('export function SignInForm'));
    const confirmCode = form.slice(form.indexOf('function ConfirmCodeForm'), form.indexOf('export function ConfirmEmailScreen'));
    assert.equal(registerForm.includes('name="code"'), false);
    assert.equal(registerForm.includes('confirmationCode'), false);
    assert.equal(confirmCode.includes('PasswordField'), false);
    assert.equal(confirmCode.includes('name="code"'), true);
    assert.equal(confirm.includes('name="password"'), false);
    assert.equal(confirm.includes('/account/confirm'), false);
    assert.equal(actions.includes("'/account/confirm'"), true);
    assert.equal(form.includes('/account/forgot-password'), true);
    assert.equal(form.includes("window.location.assign(target)"), true);
    assert.equal(form.includes('aria-busy='), true);
    assert.equal(authUi.includes('function GoogleIcon'), true);
    assert.equal(authUi.includes('function AppleIcon'), true);
    assert.equal(authUi.includes('<svg aria-hidden="true"'), true);
    assert.equal(authUi.includes('aria-label={toggleLabel}'), true);
    assert.equal(authUi.includes('rounded-3xl'), true);
    assert.equal(authUi.includes('backdrop-blur-xl'), true);
    assert.equal(authUi.includes('bg-white'), true);
    assert.equal(authUi.includes('bg-black'), true);
    assert.equal(actions.includes('writeAccounts'), false);
    assert.equal(actions.includes('registerVerifiedAccount'), false);
    assert.equal(actions.includes("redirect: '/account'"), true);
    assert.equal(actions.includes('confirmSignUpWithCognito'), true);
    assert.equal(actions.includes('confirmForgotPasswordWithCognito'), true);
    assert.equal(header.includes('left-1/2'), true);
    assert.equal(header.includes('md:absolute') || header.includes('absolute left-1/2'), true);
    assert.equal(header.includes('bg-ozora-yellow'), true);
    assert.equal(header.includes('LogIn'), true);
    assert.equal(header.includes('UserRound'), true);
    assert.equal(header.includes("signedIn ? '/account' : '/account/sign-in'"), true);
    assert.equal(header.includes('signOutAction'), true);
    assert.equal(header.includes('role="menu"'), true);
    assert.equal(header.includes("accountText(language, 'signOut')"), true);
    const onePager = readFileSync(new URL('../../one-pager/src/app/App.tsx', import.meta.url), 'utf8');
    assert.equal(onePager.includes('/account'), false);
    assert.deepEqual(Object.keys(shellCopy.en.account).sort(), Object.keys(shellCopy.pt.account).sort());
    assert.deepEqual(Object.keys(shellCopy.en.account.notices).sort(), Object.keys(shellCopy.pt.account.notices).sort());
    for (const language of locales) {
      for (const [key, value] of Object.entries(shellCopy[language].account)) {
        if (typeof value === 'string') {
          assert.notEqual(value.trim(), '', `${language}.account.${key}`);
        }
      }
      for (const notice of notices) {
        assert.notEqual(shellCopy[language].account.notices[notice].trim(), '');
      }
    }
  });
});