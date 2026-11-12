'use client';

import { KeyRound, Mail } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { completeProfileAction, confirmPasswordResetAction, confirmRegistrationAction, providerAction, registerAction, rememberConfirmationEmailAction, requestPasswordResetAction, resendConfirmationAction, signInAction, type AccountActionResult } from '../account/actions';
import { noticeForProfileFailure } from '../account/profile-failure';
import { firstProfileField, profileFieldIssues, profileInputFromFormData, type ProfileFieldIssues, type ProfileFieldName } from '../account/profile-form';
import { accountEmail } from '../account/review';
import { safeReturnPath } from '../account/return-path';
import { useAuthHref, useReturnPath } from '../account/use-return-path';
import { accountText, type AccountNotice } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';
import { TextLink } from './ui/Button';
import {
  AuthDivider,
  AuthField,
  AuthFrame,
  AuthNotice,
  AuthSubmitButton,
  PasswordField,
  PasswordGuide,
  ProviderButtons,
} from './AuthUi';
import { ProfileFields, type ProfileValues } from './ProfileFields';

function isCognitoAuthorize(target: string): boolean {
  try {
    const url = new URL(target);
    return (
      url.protocol === 'https:' &&
      /^[a-z0-9-]+\.auth\.eu-central-1\.amazoncognito\.com$/.test(url.hostname) &&
      url.pathname === '/oauth2/authorize'
    );
  } catch {
    return false;
  }
}

function accountFlowPath(target: string): '/account' | '/account/sign-in' | '/account/profile' | '/account/confirm' | undefined {
  if (!target.startsWith('/') || target.startsWith('//') || target.includes('\\') || target.includes('://')) {
    return undefined;
  }
  const path = target.split('?')[0];
  if (path === '/account' || path === '/account/sign-in' || path === '/account/profile' || path === '/account/confirm') {
    return path;
  }
  return undefined;
}

function follow(result: { redirect?: string; notice?: AccountNotice; email?: string }): boolean {
  if (!result.redirect) {
    return false;
  }
  if (isCognitoAuthorize(result.redirect)) {
    window.location.assign(result.redirect);
    return true;
  }
  const flow = accountFlowPath(result.redirect);
  const returned = safeReturnPath(result.redirect);
  const base = flow ?? returned;
  if (!base) {
    return false;
  }
  const params = new URLSearchParams();
  if ((flow === '/account/sign-in' || flow === '/account/confirm') && result.notice) {
    params.set('notice', result.notice);
  }
  const email = accountEmail(result.email);
  if ((flow === '/account/sign-in' || flow === '/account/confirm') && email) {
    params.set('email', email);
  }
  if (flow === '/account/sign-in' || flow === '/account/confirm' || flow === '/account/profile') {
    const next = safeReturnPath(new URLSearchParams(window.location.search).get('next'));
    if (next) {
      params.set('next', next);
    }
  }
  const query = params.toString();
  const target = query ? `${base}?${query}` : base;
  window.location.assign(target);
  return true;
}

function noteActionFailure(setNotice: (notice: AccountNotice) => void): void {
  setNotice('sign-in-failed');
}

function goToGoogle(next: string): void {
  const params = new URLSearchParams();
  if (next) {
    params.set('next', next);
  }
  const query = params.toString();
  window.location.assign(query ? `/account/google?${query}` : '/account/google');
}

export function RegisterForm({
  hosted = false,
  google = false,
  initialNotice = null,
}: {
  hosted?: boolean;
  google?: boolean;
  initialNotice?: AccountNotice | null;
}) {
  const { language } = useLanguage();
  const next = useReturnPath();
  const [notice, setNotice] = useState<AccountActionResult['notice'] | null>(initialNotice);
  const [pending, setPending] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<'google' | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setPending(true);
    setNotice(null);
    try {
      const result = await registerAction(new FormData(event.currentTarget));
      if (!follow(result)) {
        setNotice(result.notice ?? null);
      }
    } catch {
      noteActionFailure(setNotice);
    } finally {
      setPending(false);
    }
  }

  async function useGoogle(): Promise<void> {
    setPendingProvider('google');
    setNotice(null);
    try {
      const data = new FormData();
      data.set('provider', 'google');
      if (next) {
        data.set('next', next);
      }
      if (hosted && google) {
        goToGoogle(next);
        return;
      }
      const result = await providerAction(data);
      setNotice(result.notice);
    } catch {
      noteActionFailure(setNotice);
    } finally {
      setPendingProvider(null);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate aria-busy={pending || pendingProvider !== null}>
      <input type="hidden" name="next" value={next} />
      <ProviderButtons onProvider={() => void useGoogle()} pendingProvider={pendingProvider} />
      <AuthDivider />
      <AuthField
        label={accountText(language, 'email')}
        name="email"
        icon={Mail}
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        disabled={pending}
      />
      <PasswordField
        label={accountText(language, 'password')}
        autoComplete="new-password"
        disabled={pending}
        value={password}
        onValueChange={setPassword}
      />
      <PasswordField
        label={accountText(language, 'confirmPassword')}
        name="confirmPassword"
        autoComplete="new-password"
        disabled={pending}
        value={confirmPassword}
        onValueChange={setConfirmPassword}
      />
      <PasswordGuide password={password} confirmation={confirmPassword} />
      <AuthSubmitButton pending={pending}>{accountText(language, 'submitRegister')}</AuthSubmitButton>
      <AuthNotice notice={notice} />
    </form>
  );
}

export function SignInForm({
  hosted = false,
  google = false,
  initialNotice = null,
  initialEmail = '',
}: {
  hosted?: boolean;
  google?: boolean;
  initialNotice?: AccountNotice | null;
  initialEmail?: string;
}) {
  const { language } = useLanguage();
  const next = useReturnPath();
  const forgotHref = useAuthHref('/account/forgot-password');
  const [notice, setNotice] = useState<AccountActionResult['notice'] | null>(initialNotice);
  const [pending, setPending] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<'google' | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setPending(true);
    setNotice(null);
    try {
      const result = await signInAction(new FormData(event.currentTarget));
      if (!follow(result)) {
        setNotice(result.notice ?? null);
      }
    } catch {
      noteActionFailure(setNotice);
    } finally {
      setPending(false);
    }
  }

  async function useGoogle(): Promise<void> {
    setPendingProvider('google');
    setNotice(null);
    try {
      const data = new FormData();
      data.set('provider', 'google');
      if (next) {
        data.set('next', next);
      }
      if (hosted && google) {
        goToGoogle(next);
        return;
      }
      const result = await providerAction(data);
      setNotice(result.notice);
    } catch {
      noteActionFailure(setNotice);
    } finally {
      setPendingProvider(null);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate aria-busy={pending || pendingProvider !== null}>
      <input type="hidden" name="next" value={next} />
      <ProviderButtons onProvider={() => void useGoogle()} pendingProvider={pendingProvider} />
      <AuthDivider />
      <AuthField
        label={accountText(language, 'email')}
        name="email"
        icon={Mail}
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        disabled={pending}
        defaultValue={initialEmail || undefined}
        autoFocus={initialEmail.length > 0}
      />
      <div>
        <PasswordField label={accountText(language, 'password')} autoComplete="current-password" disabled={pending} />
        <div className="mt-2 text-right">
          <TextLink href={forgotHref} className="text-sm">
            {accountText(language, 'forgotPassword')}
          </TextLink>
        </div>
      </div>
      <AuthSubmitButton pending={pending}>{accountText(language, 'submitSignIn')}</AuthSubmitButton>
      <AuthNotice notice={notice} />
    </form>
  );
}

function ConfirmEmailForm({ initialNotice }: { initialNotice: AccountNotice | null }) {
  const { language } = useLanguage();
  const [notice, setNotice] = useState<AccountActionResult['notice'] | null>(initialNotice);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setPending(true);
    setNotice(null);
    try {
      const result = await rememberConfirmationEmailAction(new FormData(event.currentTarget));
      if (!follow(result)) {
        setNotice(result.notice ?? null);
      }
    } catch {
      noteActionFailure(setNotice);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate aria-busy={pending}>
      <AuthField
        label={accountText(language, 'email')}
        name="email"
        icon={Mail}
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        disabled={pending}
        autoFocus
      />
      <AuthSubmitButton pending={pending}>{accountText(language, 'continueConfirm')}</AuthSubmitButton>
      <AuthNotice notice={notice} />
    </form>
  );
}

function ConfirmCodeForm({ email, initialNotice }: { email: string; initialNotice: AccountNotice | null }) {
  const { language } = useLanguage();
  const changeHref = useAuthHref('/account/confirm', { change: '1' });
  const [notice, setNotice] = useState<AccountActionResult['notice'] | null>(initialNotice);
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const busy = pending || resending;

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setPending(true);
    setNotice(null);
    try {
      const result = await confirmRegistrationAction(new FormData(event.currentTarget));
      if (!follow(result)) {
        setNotice(result.notice ?? null);
      }
    } catch {
      noteActionFailure(setNotice);
    } finally {
      setPending(false);
    }
  }

  async function resend(): Promise<void> {
    setResending(true);
    setNotice(null);
    try {
      const data = new FormData();
      data.set('email', email);
      const result = await resendConfirmationAction(data);
      setNotice(result.notice ?? null);
    } catch {
      noteActionFailure(setNotice);
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate aria-busy={busy}>
      <input type="hidden" name="email" value={email} />
      <AuthField
        label={accountText(language, 'confirmationCode')}
        name="code"
        icon={KeyRound}
        inputMode="numeric"
        autoComplete="one-time-code"
        required
        disabled={busy}
        autoFocus
      />
      <p className="text-sm leading-relaxed text-ozora-cream/65">{accountText(language, 'confirmHelp')}</p>
      <AuthSubmitButton pending={pending}>{accountText(language, 'confirmAccount')}</AuthSubmitButton>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <TextLink onClick={() => void resend()} disabled={busy}>
          {resending ? accountText(language, 'working') : accountText(language, 'resendCode')}
        </TextLink>
        <TextLink href={changeHref}>
          {accountText(language, 'differentEmail')}
        </TextLink>
      </div>
      <AuthNotice notice={notice} />
    </form>
  );
}

export function ConfirmEmailScreen({ email, initialNotice }: { email: string; initialNotice: AccountNotice | null }) {
  const { language } = useLanguage();
  const signInHref = useAuthHref('/account/sign-in');
  const registerHref = useAuthHref('/account/register');
  const ready = accountEmail(email);

  return (
    <AuthFrame
      showLogo={false}
      title={accountText(language, ready ? 'confirmationTitle' : 'confirmAskTitle')}
      subtitle={
        ready
          ? accountText(language, 'confirmSubtitle').replaceAll('{email}', ready)
          : accountText(language, 'confirmAskSubtitle')
      }
      footer={
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          <TextLink href={signInHref}>
            {accountText(language, 'signIn')}
          </TextLink>
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-ozora-cream/25" />
          <TextLink href={registerHref}>
            {accountText(language, 'register')}
          </TextLink>
        </div>
      }
    >
      {ready ? (
        <ConfirmCodeForm email={ready} initialNotice={initialNotice} />
      ) : (
        <ConfirmEmailForm initialNotice={initialNotice} />
      )}
    </AuthFrame>
  );
}

export function RegisterScreen({
  hosted,
  google,
  initialNotice,
}: {
  hosted: boolean;
  google: boolean;
  initialNotice: AccountNotice | null;
}) {
  const { language } = useLanguage();
  const signInHref = useAuthHref('/account/sign-in');
  const confirmHref = useAuthHref('/account/confirm');
  return (
    <AuthFrame
      showLogo={false}
      title={accountText(language, 'registerTitle')}
      subtitle={accountText(language, 'registerSubtitle')}
      footer={
        <div className="space-y-3 text-sm text-ozora-cream/60">
          <p>
            {accountText(language, 'alreadyHaveAccount')}{' '}
            <TextLink href={signInHref}>
              {accountText(language, 'signIn')}
            </TextLink>
          </p>
          <p>
            {accountText(language, 'haveCode')}{' '}
            <TextLink href={confirmHref}>
              {accountText(language, 'enterCode')}
            </TextLink>
          </p>
        </div>
      }
    >
      <RegisterForm hosted={hosted} google={google} initialNotice={initialNotice} />
    </AuthFrame>
  );
}

export function SignInScreen({
  hosted,
  google,
  initialNotice,
  initialEmail = '',
}: {
  hosted: boolean;
  google: boolean;
  initialNotice: AccountNotice | null;
  initialEmail?: string;
}) {
  const { language } = useLanguage();
  const registerHref = useAuthHref('/account/register');
  const confirmHref = useAuthHref('/account/confirm');
  return (
    <AuthFrame
      showLogo={false}
      title={accountText(language, 'signInTitle')}
      subtitle={accountText(language, 'signInSubtitle')}
      footer={
        <div className="space-y-3 text-sm text-ozora-cream/60">
          <p>
            {accountText(language, 'newToTropical')}{' '}
            <TextLink href={registerHref}>
              {accountText(language, 'register')}
            </TextLink>
          </p>
          <p>
            {accountText(language, 'haveCode')}{' '}
            <TextLink href={confirmHref}>
              {accountText(language, 'enterCode')}
            </TextLink>
          </p>
        </div>
      }
    >
      <SignInForm
        hosted={hosted}
        google={google}
        initialNotice={initialNotice}
        initialEmail={initialEmail}
      />
    </AuthFrame>
  );
}

export function ForgotPasswordScreen({ initialNotice = null }: { initialNotice?: AccountNotice | null }) {
  const { language } = useLanguage();
  const signInHref = useAuthHref('/account/sign-in');
  const registerHref = useAuthHref('/account/register');
  const [notice, setNotice] = useState<AccountActionResult['notice'] | null>(initialNotice);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setPending(true);
    setNotice(null);
    try {
      const data = new FormData(event.currentTarget);
      const result = sent ? await confirmPasswordResetAction(data) : await requestPasswordResetAction(data);
      if (result.notice === 'reset-sent') {
        setSent(true);
      }
      if (!follow(result)) {
        setNotice(result.notice ?? null);
      }
    } catch {
      noteActionFailure(setNotice);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthFrame
      eyebrow={accountText(language, 'accountRecovery')}
      title={accountText(language, 'forgotTitle')}
      subtitle={accountText(language, 'resetHelp')}
      footer={
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          <a
            href={signInHref}
            className="font-bold text-ozora-turquoise underline-offset-4 transition hover:text-ozora-yellow hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
          >
            {accountText(language, 'signIn')}
          </a>
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-ozora-cream/25" />
          <a
            href={registerHref}
            className="font-bold text-ozora-turquoise underline-offset-4 transition hover:text-ozora-yellow hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
          >
            {accountText(language, 'register')}
          </a>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate aria-busy={pending}>
        {sent ? (
          <div className="rounded-2xl border border-ozora-green/30 bg-ozora-green/10 p-4">
            <p className="font-bold text-ozora-cream">{accountText(language, 'confirmationTitle')}</p>
            <p className="mt-1 text-sm leading-relaxed text-ozora-cream/65">{accountText(language, 'resetHelp')}</p>
          </div>
        ) : null}
        <AuthField
          label={accountText(language, 'email')}
          name="email"
          icon={Mail}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          readOnly={sent}
          disabled={pending}
        />
        {sent ? (
          <>
            <AuthField
              label={accountText(language, 'confirmationCode')}
              name="code"
              icon={KeyRound}
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              disabled={pending}
            />
            <PasswordField
              label={accountText(language, 'newPassword')}
              autoComplete="new-password"
              disabled={pending}
              value={password}
              onValueChange={setPassword}
            />
            <PasswordField
              label={accountText(language, 'confirmPassword')}
              name="confirmPassword"
              autoComplete="new-password"
              disabled={pending}
              value={confirmPassword}
              onValueChange={setConfirmPassword}
            />
            <PasswordGuide password={password} confirmation={confirmPassword} />
          </>
        ) : null}
        <AuthSubmitButton pending={pending}>{accountText(language, sent ? 'submitReset' : 'sendCode')}</AuthSubmitButton>
        <AuthNotice notice={notice} />
      </form>
    </AuthFrame>
  );
}

export function ProfileSetupScreen({
  initialNotice = null,
  email = '',
  values,
  previewUrl,
}: {
  initialNotice?: AccountNotice | null;
  email?: string;
  values?: Partial<ProfileValues>;
  previewUrl?: string;
}) {
  const { language } = useLanguage();
  const next = useReturnPath();
  const [notice, setNotice] = useState<AccountActionResult['notice'] | null>(initialNotice);
  const [pending, setPending] = useState(false);
  const [issues, setIssues] = useState<ProfileFieldIssues>({});
  const [skipPicture, setSkipPicture] = useState(false);

  function clearIssue(field: ProfileFieldName): void {
    setIssues((current) => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const nextIssues = profileFieldIssues(profileInputFromFormData(new FormData(event.currentTarget)));
    setIssues(nextIssues);
    const first = firstProfileField(nextIssues);
    if (first) {
      event.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setPending(true);
    setNotice(null);
    try {
      const result = await completeProfileAction(new FormData(event.currentTarget));
      if (!follow(result)) {
        setNotice(result.notice ?? null);
      }
    } catch (error) {
      setNotice(noticeForProfileFailure(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthFrame
      showLogo={false}
      wide
      title={accountText(language, 'profileTitle')}
      subtitle={accountText(language, 'profileHelp')}
    >
      <form onSubmit={onSubmit} className="space-y-7" encType="multipart/form-data" noValidate aria-busy={pending}>
        <input type="hidden" name="next" value={next} />
        {skipPicture ? <input type="hidden" name="skipGooglePicture" value="1" /> : null}
        {email ? (
          <AuthField
            label={accountText(language, 'email')}
            name="shownEmail"
            icon={Mail}
            type="email"
            autoComplete="email"
            readOnly
            defaultValue={email}
          />
        ) : null}
        <ProfileFields
          pending={pending}
          issues={issues}
          values={values}
          initialPreview={previewUrl}
          onNotice={setNotice}
          onClearIssue={clearIssue}
          onCleared={() => setSkipPicture(true)}
        />
        <AuthSubmitButton pending={pending}>{accountText(language, 'saveProfile')}</AuthSubmitButton>
        <AuthNotice notice={notice} />
      </form>
    </AuthFrame>
  );
}

