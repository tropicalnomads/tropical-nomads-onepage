'use client';

import { useState, type FormEvent } from 'react';
import { providerAction, registerAction, signInAction, type AccountActionResult } from '../account/actions';
import { accountNotice, accountText } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';

const fieldClass =
  'mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-ozora-cream outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise';

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

export function RegisterForm() {
  const { language } = useLanguage();
  const [notice, setNotice] = useState<AccountActionResult['notice'] | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const result = await registerAction(new FormData(event.currentTarget));
    setNotice(result.notice);
  }

  async function useProvider(provider: 'google' | 'apple'): Promise<void> {
    const data = new FormData();
    data.set('provider', provider);
    const result = await providerAction(data);
    setNotice(result.notice);
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
      <label className="block text-sm text-ozora-cream/80">
        {accountText(language, 'email')}
        <input name="email" type="email" autoComplete="email" required className={fieldClass} />
      </label>
      <label className="block text-sm text-ozora-cream/80">
        {accountText(language, 'password')}
        <input name="password" type="password" autoComplete="new-password" required minLength={12} className={fieldClass} />
      </label>
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
      <ProviderButtons onProvider={(provider) => void useProvider(provider)} />
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

export function SignInForm() {
  const { language } = useLanguage();
  const [notice, setNotice] = useState<AccountActionResult['notice'] | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const result = await signInAction(new FormData(event.currentTarget));
    setNotice(result.notice);
  }

  async function useProvider(provider: 'google' | 'apple'): Promise<void> {
    const data = new FormData();
    data.set('provider', provider);
    const result = await providerAction(data);
    setNotice(result.notice);
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
      <label className="block text-sm text-ozora-cream/80">
        {accountText(language, 'email')}
        <input name="email" type="email" autoComplete="email" required className={fieldClass} />
      </label>
      <label className="block text-sm text-ozora-cream/80">
        {accountText(language, 'password')}
        <input name="password" type="password" autoComplete="current-password" required minLength={12} className={fieldClass} />
      </label>
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
