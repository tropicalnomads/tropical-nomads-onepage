'use client';

import type { ReactNode } from 'react';
import { signOutAction } from '../account/actions';
import { accountText } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';

export interface AccountSummary {
  username: string;
  givenName: string;
  familyName: string;
  email: string;
  status: 'active' | 'disabled';
  paymentMethods: number;
}

function Frame({ title, children }: { title: string; children: ReactNode }) {
  const { language } = useLanguage();
  return (
    <main>
      <section className="px-5 py-8 md:px-8">
        <div className="mx-auto max-w-lg">
          <h1 className="text-2xl font-bold text-ozora-cream md:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-ozora-cream/75">{accountText(language, 'intro')}</p>
          {children}
        </div>
      </section>
    </main>
  );
}

export function AccountHome({ profile }: { profile: AccountSummary | null }) {
  const { language } = useLanguage();
  if (!profile) {
    return (
      <Frame title={accountText(language, 'accountTitle')}>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href="/account/sign-in"
            className="rounded-lg bg-ozora-coral px-4 py-2 text-center text-sm font-semibold text-ozora-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow"
          >
            {accountText(language, 'signIn')}
          </a>
          <a
            href="/account/register"
            className="rounded-lg border border-white/20 px-4 py-2 text-center text-sm font-semibold text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
          >
            {accountText(language, 'register')}
          </a>
        </div>
      </Frame>
    );
  }
  return (
    <Frame title={accountText(language, 'accountTitle')}>
      <dl className="mt-6 space-y-2 text-sm text-ozora-cream">
        <div>
          <dt className="text-ozora-cream/60">{accountText(language, 'username')}</dt>
          <dd>{profile.username}</dd>
        </div>
        <div>
          <dt className="text-ozora-cream/60">{accountText(language, 'givenName')}</dt>
          <dd>
            {profile.givenName} {profile.familyName}
          </dd>
        </div>
        <div>
          <dt className="text-ozora-cream/60">{accountText(language, 'email')}</dt>
          <dd>{profile.email}</dd>
        </div>
      </dl>
      {profile.status === 'disabled' ? <p className="mt-4 text-sm text-ozora-yellow">{accountText(language, 'disabled')}</p> : null}
      {profile.paymentMethods === 0 ? <p className="mt-4 text-sm text-ozora-cream/70">{accountText(language, 'noPaymentMethod')}</p> : null}
      <form action={signOutAction} className="mt-6">
        <button
          type="submit"
          className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
        >
          {accountText(language, 'signOut')}
        </button>
      </form>
    </Frame>
  );
}
