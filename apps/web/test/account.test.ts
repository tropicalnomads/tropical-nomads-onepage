import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { locales } from 'tropical-nomads-shared';
import { reviewConfirmationCode, reviewEmail, reviewPasswordSignIn, reviewProfileNames, reviewProvider, reviewRegistration } from '../src/account/review.ts';
import { configuredSessionSecret, createSessionToken, readSessionSub, sessionSecretConfigured } from '../src/account/session.ts';
import { noticeForProfileFailure } from '../src/account/profile-failure.ts';
import { accountIdentity, canonicalProfilePhone, profileFieldIssues, profileIssueCopyKey, type ProfileFieldInput } from '../src/account/profile-form.ts';
import { noticeForSignInFailure } from '../src/account/sign-in-failure.ts';
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
  'avatar-too-large',
  'avatar-saved',
  'profile-invalid',
  'profile-saved',
  'profile-save-failed',
  'sign-in-failed',
  'email-taken',
  'google-cancelled',
  'sign-in-expired',
  'google-email-unverified',
  'google-failed',
  'account-disabled',
  'account-conflict',
  'account-deleted',
  'account-delete-failed',
  'account-delete-unconfirmed',
  'account-delete-email',
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
    assert.equal(readSessionSub(token, Date.parse('2026-11-09T18:00:00.000Z')), 'sub-ada');
    assert.equal(readSessionSub(token, Date.parse('2026-12-09T18:00:00.000Z')), undefined);
    const register = readFileSync(new URL('../app/account/register/page.tsx', import.meta.url), 'utf8');
    const confirm = readFileSync(new URL('../app/account/confirm/page.tsx', import.meta.url), 'utf8');
    const forgot = readFileSync(new URL('../app/account/forgot-password/page.tsx', import.meta.url), 'utf8');
    const form = readFileSync(new URL('../src/components/AccountForms.tsx', import.meta.url), 'utf8');
    const authUi = readFileSync(new URL('../src/components/AuthUi.tsx', import.meta.url), 'utf8');
    const actions = readFileSync(new URL('../src/account/actions.ts', import.meta.url), 'utf8');
    const header = readFileSync(new URL('../src/components/ShellHeader.tsx', import.meta.url), 'utf8');
    const menu = readFileSync(new URL('../src/components/ui/Menu.tsx', import.meta.url), 'utf8');
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
    assert.equal(authUi.includes('function AppleIcon'), false);
    assert.equal(authUi.includes('continueApple'), false);
    assert.equal(form.includes("data.set('provider', 'google')"), true);
    assert.equal(form.includes("data.set('provider', 'apple')"), false);
    assert.equal(authUi.includes('<svg aria-hidden="true"'), true);
    assert.equal(authUi.includes('label={toggleLabel}'), true);
    assert.equal(authUi.includes('rounded-3xl'), true);
    assert.equal(authUi.includes('backdrop-blur-xl'), true);
    assert.equal(authUi.includes('bg-white'), true);
    assert.equal(authUi.includes('bg-black'), true);
    assert.equal(actions.includes('writeAccounts'), false);
    assert.equal(actions.includes('registerVerifiedAccount'), false);
    assert.equal(actions.includes('takeReturnPath'), true);
    assert.equal(actions.includes('rememberReturnPath'), true);
    assert.equal(actions.includes('sessionCookie(sessionCookieMaxAge)'), true);
    assert.equal(actions.includes("redirect: '/account'"), false);
    assert.equal(actions.includes('confirmSignUpWithCognito'), true);
    assert.equal(actions.includes('confirmForgotPasswordWithCognito'), true);
    assert.equal(header.includes('left-1/2'), true);
    assert.equal(header.includes('md:absolute') || header.includes('absolute left-1/2'), true);
    assert.equal(header.includes('bg-ozora-yellow'), true);
    assert.equal(header.includes('LogIn'), true);
    assert.equal(header.includes('UserRound'), true);
    assert.equal(header.includes("signedIn ? '/account' : signInHref(here)"), true);
    assert.equal(header.includes('signOutAction'), true);
    assert.equal(menu.includes('role="menu"'), true);
    assert.equal(header.includes("accountText(language, 'signOut')"), true);
    assert.equal(header.includes('href="/my-tickets"'), true);
    assert.equal(header.includes("areaText(language, 'my-tickets')"), true);
    assert.equal(header.includes('href="/my-orders"'), true);
    assert.equal(header.includes("areaText(language, 'my-orders')"), true);
    assert.equal(header.includes('ReceiptText'), true);
    assert.equal(header.includes('/check-in'), false);
    assert.equal(actions.includes('noticeForSignInFailure'), true);
    assert.equal(actions.includes('finishSignIn'), true);
    assert.equal(actions.includes('await remember(claims.sub)'), true);
    const profileSetup = form.slice(form.indexOf('export function ProfileSetupScreen'));
    assert.equal(profileSetup.includes('href="/account/sign-in"'), false);
    assert.equal(profileSetup.includes('noticeForProfileFailure'), true);
    assert.equal(profileSetup.includes('noteActionFailure'), false);
    const profileFields = readFileSync(new URL('../src/components/ProfileFields.tsx', import.meta.url), 'utf8');
    assert.equal(profileFields.includes('CroppedImageField'), true);
    assert.equal(profileFields.includes('presentation="avatar"'), true);
    assert.equal(profileFields.includes('cropShape="round"'), true);
    assert.equal(profileFields.includes('avatarCropSize'), true);
    assert.equal(profileFields.includes("onNotice?.(reason === 'too-large' ? 'avatar-too-large' : 'avatar-rejected')"), true);
    assert.equal(profileFields.includes('error={errorFor('), true);
    assert.equal(profileSetup.includes('profileFieldIssues'), true);
    const blank: ProfileFieldInput = {
      givenName: '',
      familyName: ' ',
      displayName: '',
      phone: '',
      city: '',
      region: '',
      postalCode: '',
      country: '',
    };
    assert.deepEqual(profileFieldIssues(blank), { givenName: 'required', familyName: 'required' });
    assert.deepEqual(
      profileFieldIssues({ ...blank, givenName: 'Ada', familyName: 'Lovelace', phone: '+353 87 123 4567' }),
      {},
    );
    assert.equal(canonicalProfilePhone('+353 87 123 4567'), '+353871234567');
    assert.equal(profileFieldIssues({ ...blank, givenName: 'Ada', familyName: 'Lovelace', phone: '0871234567' }).phone, 'phone');
    assert.equal(
      profileFieldIssues({ ...blank, givenName: 'Ada', familyName: 'Lovelace', displayName: 'x'.repeat(81) }).displayName,
      'too-long',
    );
    assert.equal(accountIdentity({ displayName: 'AfterJune', givenName: 'Júlio', familyName: 'Locatelli Piva' }), 'AfterJune');
    assert.equal(accountIdentity({ displayName: '  ', givenName: 'Júlio', familyName: 'Locatelli Piva' }), 'Júlio Locatelli Piva');
    assert.equal(profileIssueCopyKey('givenName', 'required'), 'givenNameRequired');
    assert.equal(profileIssueCopyKey('phone', 'phone'), 'phoneInvalid');
    assert.equal(shellCopy.en.account.givenNameRequired, 'Enter your given name.');
    assert.equal(shellCopy.pt.account.familyNameRequired, 'Informe o apelido.');
    assert.equal(shellCopy.en.account.phoneInvalid, 'Use a country code and digits only, like +353871234567.');
    assert.equal(noticeForProfileFailure(new Error('payload is too large')), 'avatar-too-large');
    assert.equal(noticeForProfileFailure(new Error('Body exceeded 1 MB limit')), 'avatar-too-large');
    assert.equal(noticeForProfileFailure(new Error('avatar is not an image')), 'avatar-rejected');
    assert.equal(noticeForProfileFailure(new Error('catalog unavailable')), 'profile-save-failed');
    assert.equal(shellCopy.en.account.notices['avatar-too-large'], 'That photo is larger than 5 MB.');
    assert.equal(shellCopy.pt.account.notices['avatar-too-large'], 'Essa foto é maior que 5 MB.');
    assert.equal(shellCopy.en.account.notices['profile-save-failed'], 'The profile could not be saved. Try again.');
    assert.equal(shellCopy.pt.account.notices['profile-save-failed'], 'Não foi possível salvar o perfil. Tente de novo.');
    const accountPage = readFileSync(new URL('../app/account/page.tsx', import.meta.url), 'utf8');
    assert.equal(accountPage.includes("profileSetupHref('/account')"), true);
    const signInForm = form.slice(form.indexOf('export function SignInForm'), form.indexOf('function ConfirmEmailForm'));
    assert.equal(signInForm.includes('noteActionFailure(setNotice)'), true);
    const built = 'b'.repeat(40);
    const fromEnv = 'e'.repeat(40);
    assert.equal(configuredSessionSecret(fromEnv, built), fromEnv);
    assert.equal(configuredSessionSecret('short', built), built);
    assert.equal(configuredSessionSecret(undefined, ''), undefined);
    assert.equal(sessionSecretConfigured({ ACCOUNT_SESSION_SECRET: fromEnv }, ''), true);
    assert.equal(sessionSecretConfigured({}, ''), false);
    assert.equal(sessionSecretConfigured({}, built), true);
    assert.equal(noticeForSignInFailure(new Error('request was not accepted')), 'sign-in-failed');
    assert.equal(noticeForSignInFailure(new Error('request failed')), 'sign-in-failed');
    assert.equal(noticeForSignInFailure('sign-in failed'), 'sign-in-failed');
    assert.equal(shellCopy.en.account.notices['sign-in-failed'], 'Sign-in could not be completed. Try again.');
    assert.equal(shellCopy.pt.account.notices['sign-in-failed'], 'Não foi possível entrar. Tente de novo.');
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

  it('returns a completed sign-in to the page that started it', () => {
    const actions = readFileSync(new URL('../src/account/actions.ts', import.meta.url), 'utf8');
    const header = readFileSync(new URL('../src/components/ShellHeader.tsx', import.meta.url), 'utf8');
    const accountPage = readFileSync(new URL('../app/account/page.tsx', import.meta.url), 'utf8');
    const form = readFileSync(new URL('../src/components/AccountForms.tsx', import.meta.url), 'utf8');
    const callback = readFileSync(new URL('../app/account/callback/route.ts', import.meta.url), 'utf8');
    assert.equal(actions.includes('takeReturnPath'), true);
    assert.equal(actions.includes('rememberReturnPath'), true);
    assert.equal(actions.includes('sessionCookie(sessionCookieMaxAge)'), true);
    assert.equal(actions.includes("redirect: '/account'"), false);
    assert.equal(actions.includes("'/account/profile'"), true);
    assert.equal(header.includes("signedIn ? '/account' : signInHref(here)"), true);
    assert.equal(accountPage.includes("profileSetupHref('/account')"), true);
    assert.equal(form.includes('safeReturnPath'), true);
    assert.equal(form.includes('name="next"'), true);
    assert.equal(callback.includes('clearReturnPath'), true);
    assert.equal(callback.includes("new URL(next ?? '/', origin)"), true);
    assert.equal(callback.includes('!existing?.avatarKey && claims.pictureUrl'), true);
  });

  it('deletes the signed-in account only after the person confirms', () => {
    const home = readFileSync(new URL('../src/components/AccountHome.tsx', import.meta.url), 'utf8');
    const action = readFileSync(new URL('../src/account/delete-account.ts', import.meta.url), 'utf8');
    const api = readFileSync(new URL('../../api/src/private-api.ts', import.meta.url), 'utf8');
    const body = action.slice(action.indexOf('export async function deleteAccountAction'));
    const signedOut = home.slice(home.indexOf('if (!profile)'), home.indexOf('<AccountProfileForm'));
    assert.equal(signedOut.includes('<dialog'), false);
    assert.equal(home.includes('<dialog'), true);
    assert.equal(home.includes('name="confirm"'), true);
    assert.equal(home.includes('value="delete"'), true);
    assert.equal(home.includes('name="email"'), true);
    assert.equal(home.includes('onPaste={blockClipboard}'), true);
    assert.equal(home.includes("inputType === 'insertFromPaste'"), true);
    assert.equal(home.includes('deleteAccountAction'), true);
    assert.equal(action.includes("formData.get('confirm') !== 'delete'"), true);
    assert.equal(action.includes('normalizeAccountEmail(typed) !== normalizeAccountEmail(profile.email)'), true);
    assert.equal(body.indexOf('normalizeAccountEmail(profile.email)') < body.indexOf("callPrivate('delete-account'"), true);
    assert.equal(body.indexOf("callPrivate('delete-account'") < body.indexOf('await clearAccountCookies()'), true);
    assert.equal(body.indexOf('commitAccountErasure') < body.indexOf('await clearAccountCookies()'), true);
    assert.equal(api.includes("case 'delete-account'"), true);
  });
});