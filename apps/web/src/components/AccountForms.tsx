'use client';

import { KeyRound, Mail } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { completeProfileAction, confirmPasswordResetAction, confirmRegistrationAction, providerAction, registerAction, rememberConfirmationEmailAction, requestPasswordResetAction, resendConfirmationAction, signInAction, type AccountActionResult } from '../account/actions';
import { startHostedSignIn } from '../account/cognito-actions';
import { noticeForProfileFailure } from '../account/profile-failure';
import { firstProfileField, profileFieldIssues, profileInputFromFormData, type ProfileFieldIssues, type ProfileFieldName } from '../account/profile-form';
import { accountEmail } from '../account/review';
import { accountText, type AccountNotice } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';
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
import { ProfileFields } from './ProfileFields';

const textLinkClass =
  'font-bold text-ozora-turquoise underline-offset-4 transition hover:text-ozora-yellow hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise';

function follow(result: { redirect?: string; notice?: AccountNotice; email?: string }): boolean {
  if (!result.redirect) {
    return false;
  }
  const params = new URLSearchParams();
  if ((result.redirect === '/account/sign-in' || result.redirect === '/account/confirm') && result.notice) {
    params.set('notice', result.notice);
  }
  const email = accountEmail(result.email);
  if ((result.redirect === '/account/sign-in' || result.redirect === '/account/confirm') && email) {
    params.set('email', email);
  }
  const query = params.toString();
  const target = query ? `${result.redirect}?${query}` : result.redirect;
  if (target.startsWith('/account') && !target.startsWith('//') && !target.includes('\\')) {
    window.location.assign(target);
    return true;
  }
  try {
    const url = new URL(target);
    if (
      url.protocol === 'https:' &&
      /^[a-z0-9-]+\.auth\.eu-central-1\.amazoncognito\.com$/.test(url.hostname) &&
      url.pathname === '/oauth2/authorize'
    ) {
      window.location.assign(url.toString());
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

function noteActionFailure(setNotice: (notice: AccountNotice) => void): void {
  setNotice('sign-in-failed');
}

export function RegisterForm({
  hosted = false,
  google = false,
  apple = false,
  initialNotice = null,
}: {
  hosted?: boolean;
  google?: boolean;
  apple?: boolean;
  initialNotice?: AccountNotice | null;
}) {
  const { language } = useLanguage();
  const [notice, setNotice] = useState<AccountActionResult['notice'] | null>(initialNotice);
  const [pending, setPending] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<'google' | 'apple' | null>(null);
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

  async function useProvider(provider: 'google' | 'apple'): Promise<void> {
    setPendingProvider(provider);
    setNotice(null);
    try {
      const data = new FormData();
      data.set('provider', provider);
      if (hosted && ((provider === 'google' && google) || (provider === 'apple' && apple))) {
        const result = await startHostedSignIn(data);
        if (!follow(result)) {
          setNotice(result.notice);
        }
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
      <ProviderButtons onProvider={(provider) => void useProvider(provider)} pendingProvider={pendingProvider} />
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
  apple = false,
  initialNotice = null,
  initialEmail = '',
}: {
  hosted?: boolean;
  google?: boolean;
  apple?: boolean;
  initialNotice?: AccountNotice | null;
  initialEmail?: string;
}) {
  const { language } = useLanguage();
  const [notice, setNotice] = useState<AccountActionResult['notice'] | null>(initialNotice);
  const [pending, setPending] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<'google' | 'apple' | null>(null);

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

  async function useProvider(provider: 'google' | 'apple'): Promise<void> {
    setPendingProvider(provider);
    setNotice(null);
    try {
      const data = new FormData();
      data.set('provider', provider);
      if (hosted && ((provider === 'google' && google) || (provider === 'apple' && apple))) {
        const result = await startHostedSignIn(data);
        if (!follow(result)) {
          setNotice(result.notice);
        }
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
      <ProviderButtons onProvider={(provider) => void useProvider(provider)} pendingProvider={pendingProvider} />
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
          <a
            href="/account/forgot-password"
            className="text-sm font-semibold text-ozora-turquoise underline-offset-4 transition hover:text-ozora-yellow hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
          >
            {accountText(language, 'forgotPassword')}
          </a>
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
        <button
          type="button"
          onClick={() => void resend()}
          disabled={busy}
          className={`${textLinkClass} disabled:cursor-wait disabled:opacity-60`}
        >
          {resending ? accountText(language, 'working') : accountText(language, 'resendCode')}
        </button>
        <a href="/account/confirm?change=1" className={textLinkClass}>
          {accountText(language, 'differentEmail')}
        </a>
      </div>
      <AuthNotice notice={notice} />
    </form>
  );
}

export function ConfirmEmailScreen({ email, initialNotice }: { email: string; initialNotice: AccountNotice | null }) {
  const { language } = useLanguage();
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
          <a href="/account/sign-in" className={textLinkClass}>
            {accountText(language, 'signIn')}
          </a>
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-ozora-cream/25" />
          <a href="/account/register" className={textLinkClass}>
            {accountText(language, 'register')}
          </a>
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
  apple,
  initialNotice,
}: {
  hosted: boolean;
  google: boolean;
  apple: boolean;
  initialNotice: AccountNotice | null;
}) {
  const { language } = useLanguage();
  return (
    <AuthFrame
      showLogo={false}
      title={accountText(language, 'registerTitle')}
      subtitle={accountText(language, 'registerSubtitle')}
      footer={
        <div className="space-y-3 text-sm text-ozora-cream/60">
          <p>
            {accountText(language, 'alreadyHaveAccount')}{' '}
            <a href="/account/sign-in" className={textLinkClass}>
              {accountText(language, 'signIn')}
            </a>
          </p>
          <p>
            {accountText(language, 'haveCode')}{' '}
            <a href="/account/confirm" className={textLinkClass}>
              {accountText(language, 'enterCode')}
            </a>
          </p>
        </div>
      }
    >
      <RegisterForm hosted={hosted} google={google} apple={apple} initialNotice={initialNotice} />
    </AuthFrame>
  );
}

export function SignInScreen({
  hosted,
  google,
  apple,
  initialNotice,
  initialEmail = '',
}: {
  hosted: boolean;
  google: boolean;
  apple: boolean;
  initialNotice: AccountNotice | null;
  initialEmail?: string;
}) {
  const { language } = useLanguage();
  return (
    <AuthFrame
      showLogo={false}
      title={accountText(language, 'signInTitle')}
      subtitle={accountText(language, 'signInSubtitle')}
      footer={
        <div className="space-y-3 text-sm text-ozora-cream/60">
          <p>
            {accountText(language, 'newToTropical')}{' '}
            <a href="/account/register" className={textLinkClass}>
              {accountText(language, 'register')}
            </a>
          </p>
          <p>
            {accountText(language, 'haveCode')}{' '}
            <a href="/account/confirm" className={textLinkClass}>
              {accountText(language, 'enterCode')}
            </a>
          </p>
        </div>
      }
    >
      <SignInForm
        hosted={hosted}
        google={google}
        apple={apple}
        initialNotice={initialNotice}
        initialEmail={initialEmail}
      />
    </AuthFrame>
  );
}

export function ForgotPasswordScreen({ initialNotice = null }: { initialNotice?: AccountNotice | null }) {
  const { language } = useLanguage();
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
            href="/account/sign-in"
            className="font-bold text-ozora-turquoise underline-offset-4 transition hover:text-ozora-yellow hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
          >
            {accountText(language, 'signIn')}
          </a>
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-ozora-cream/25" />
          <a
            href="/account/register"
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

export function ProfileSetupScreen({ initialNotice = null }: { initialNotice?: AccountNotice | null }) {
  const { language } = useLanguage();
  const [notice, setNotice] = useState<AccountActionResult['notice'] | null>(initialNotice);
  const [pending, setPending] = useState(false);
  const [issues, setIssues] = useState<ProfileFieldIssues>({});

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
        <ProfileFields pending={pending} issues={issues} onNotice={setNotice} onClearIssue={clearIssue} />
        <AuthSubmitButton pending={pending}>{accountText(language, 'saveProfile')}</AuthSubmitButton>
        <AuthNotice notice={notice} />
      </form>
    </AuthFrame>
  );
}

