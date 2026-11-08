'use client';

import { useState, type FormEvent } from 'react';
import { providerAction, registerAction, signInAction, type AccountActionResult } from '../account/actions';
import { finishVerifiedSignIn, startHostedSignIn } from '../account/cognito-actions';
import { accountNotice, accountText, type AccountNotice } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';

const fieldClass =
  'mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-ozora-cream outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise';

function follow(result: { redirect?: string }): boolean {
  const target = result.redirect;
  if (!target) {
    return false;
  }
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

function ProviderButtons({ onProvider }: { onProvider: (provider: 'google' | 'apple') => void }) {
  const { language } = useLanguage();
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        onClick={() => onProvider('google')}
        className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
      >
        {accountText(language, 'continueGoogle')}
      </button>
      <button
        type="button"
        onClick={() => onProvider('apple')}
        className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
      >
        {accountText(language, 'continueApple')}
      </button>
    </div>
  );
}

function Notice({ notice }: { notice: AccountActionResult['notice'] | null }) {
  const { language } = useLanguage();
  if (!notice) {
    return null;
  }
  return (
    <p role="status" className="mt-4 text-sm text-ozora-yellow">
      {accountNotice(language, notice)}
    </p>
  );
}

export function RegisterForm({
  hosted = false,
  google = false,
  apple = false,
  needsUsername = false,
  initialNotice = null,
}: {
  hosted?: boolean;
  google?: boolean;
  apple?: boolean;
  needsUsername?: boolean;
  initialNotice?: AccountNotice | null;
}) {
  const { language } = useLanguage();
  const [notice, setNotice] = useState<AccountActionResult['notice'] | null>(initialNotice);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (needsUsername) {
      const result = await finishVerifiedSignIn(data);
      if (!follow(result)) {
        setNotice(result.notice);
      }
      return;
    }
    if (hosted) {
      data.set('provider', 'cognito');
      const result = await startHostedSignIn(data);
      if (!follow(result)) {
        setNotice(result.notice);
      }
      return;
    }
    const result = await registerAction(data);
    setNotice(result.notice);
  }

  async function useProvider(provider: 'google' | 'apple'): Promise<void> {
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
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
      {hosted || needsUsername ? null : (
        <label className="block text-sm text-ozora-cream/80">
          {accountText(language, 'email')}
          <input name="email" type="email" autoComplete="email" required className={fieldClass} />
        </label>
      )}
      {hosted || needsUsername ? null : (
        <label className="block text-sm text-ozora-cream/80">
          {accountText(language, 'password')}
          <input name="password" type="password" autoComplete="new-password" required minLength={12} className={fieldClass} />
        </label>
      )}
      <label className="block text-sm text-ozora-cream/80">
        {accountText(language, 'username')}
        <input name="username" type="text" autoComplete="nickname" required className={fieldClass} />
      </label>
      <label className="block text-sm text-ozora-cream/80">
        {accountText(language, 'givenName')}
        <input name="givenName" type="text" autoComplete="given-name" required className={fieldClass} />
      </label>
      <label className="block text-sm text-ozora-cream/80">
        {accountText(language, 'familyName')}
        <input name="familyName" type="text" autoComplete="family-name" required className={fieldClass} />
      </label>
      <p className="text-sm text-ozora-cream/70">{accountText(language, 'billingLater')}</p>
      {needsUsername ? null : <ProviderButtons onProvider={(provider) => void useProvider(provider)} />}
      <button
        type="submit"
        className="rounded-lg bg-ozora-coral px-4 py-2 text-sm font-semibold text-ozora-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow"
      >
        {accountText(language, 'submitRegister')}
      </button>
      <Notice notice={notice} />
    </form>
  );
}

export function SignInForm({
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

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (hosted) {
      data.set('provider', 'cognito');
      const result = await startHostedSignIn(data);
      if (!follow(result)) {
        setNotice(result.notice);
      }
      return;
    }
    const result = await signInAction(data);
    setNotice(result.notice);
  }

  async function useProvider(provider: 'google' | 'apple'): Promise<void> {
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
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
      {hosted ? null : (
        <label className="block text-sm text-ozora-cream/80">
          {accountText(language, 'email')}
          <input name="email" type="email" autoComplete="email" required className={fieldClass} />
        </label>
      )}
      {hosted ? null : (
        <label className="block text-sm text-ozora-cream/80">
          {accountText(language, 'password')}
          <input name="password" type="password" autoComplete="current-password" required minLength={12} className={fieldClass} />
        </label>
      )}
      <button
        type="submit"
        className="rounded-lg bg-ozora-coral px-4 py-2 text-sm font-semibold text-ozora-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow"
      >
        {accountText(language, 'submitSignIn')}
      </button>
      <ProviderButtons onProvider={(provider) => void useProvider(provider)} />
      <Notice notice={notice} />
    </form>
  );
}

export function RegisterScreen({
  hosted,
  google,
  apple,
  needsUsername,
  initialNotice,
}: {
  hosted: boolean;
  google: boolean;
  apple: boolean;
  needsUsername: boolean;
  initialNotice: AccountNotice | null;
}) {
  const { language } = useLanguage();
  return (
    <main>
      <section className="px-5 py-8 md:px-8">
        <div className="mx-auto max-w-lg">
          <h1 className="text-2xl font-bold text-ozora-cream md:text-3xl">{accountText(language, 'registerTitle')}</h1>
          <p className="mt-2 text-sm text-ozora-cream/75">{accountText(language, 'intro')}</p>
          <RegisterForm hosted={hosted} google={google} apple={apple} needsUsername={needsUsername} initialNotice={initialNotice} />
          <p className="mt-6 text-sm text-ozora-cream/70">
            <a href="/account/sign-in" className="text-ozora-turquoise underline-offset-2 hover:underline">
              {accountText(language, 'signIn')}
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}

export function SignInScreen({
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
    <main>
      <section className="px-5 py-8 md:px-8">
        <div className="mx-auto max-w-lg">
          <h1 className="text-2xl font-bold text-ozora-cream md:text-3xl">{accountText(language, 'signInTitle')}</h1>
          <p className="mt-2 text-sm text-ozora-cream/75">{accountText(language, 'intro')}</p>
          <SignInForm hosted={hosted} google={google} apple={apple} initialNotice={initialNotice} />
          <p className="mt-6 text-sm text-ozora-cream/70">
            <a href="/account/register" className="text-ozora-turquoise underline-offset-2 hover:underline">
              {accountText(language, 'register')}
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
