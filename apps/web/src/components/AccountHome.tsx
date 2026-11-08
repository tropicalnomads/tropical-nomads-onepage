'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { signOutAction } from '../account/actions';
import { saveAvatarAction } from '../account/avatar';
import { accountNotice, accountText, paymentPurposeLabel, paymentText, type AccountNotice } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';
import { PaymentSection, type BillingSummary, type PendingTrace, type SavedMethod } from './PaymentSection';

export interface TeamTrace {
  id: string;
  username: string;
  amount: number;
  currency: string;
  purpose: 'tickets' | 'merch';
}

export interface AccountSummary {
  username: string;
  givenName: string;
  familyName: string;
  email: string;
  status: 'active' | 'disabled';
  canPay: boolean;
  hasAvatar: boolean;
  billing: BillingSummary | null;
  methods: readonly SavedMethod[];
  traces: readonly PendingTrace[];
  teamTraces: readonly TeamTrace[] | null;
}

function Frame({ title, wide, children }: { title: string; wide?: boolean; children: ReactNode }) {
  const { language } = useLanguage();
  return (
    <main>
      <section className="px-5 py-8 md:px-8">
        <div className={`mx-auto ${wide ? 'max-w-3xl' : 'max-w-lg'}`}>
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
    <Frame title={accountText(language, 'accountTitle')} wide={profile.teamTraces !== null}>
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
      {profile.status === 'active' ? <AvatarForm hasAvatar={profile.hasAvatar} /> : null}
      {profile.teamTraces ? <TeamTraces traces={profile.teamTraces} /> : null}
      <PaymentSection canPay={profile.canPay} billing={profile.billing} methods={profile.methods} traces={profile.traces} />
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

function AvatarForm({ hasAvatar }: { hasAvatar: boolean }) {
  const { language } = useLanguage();
  const [notice, setNotice] = useState<AccountNotice | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const result = await saveAvatarAction(new FormData(event.currentTarget));
    setNotice(result.notice);
    if (result.notice === 'avatar-saved') {
      window.location.assign('/account');
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3">
      <h2 className="text-lg font-semibold text-ozora-cream">{accountText(language, 'avatarTitle')}</h2>
      {hasAvatar ? <img src="/account/avatar" alt="" className="h-16 w-16 rounded-full border border-white/20 object-cover" /> : null}
      <p className="text-sm text-ozora-cream/70">{accountText(language, 'avatarHelp')}</p>
      <input
        name="avatar"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        required
        className="block w-full text-sm text-ozora-cream file:mr-3 file:rounded-lg file:border-0 file:bg-ozora-coral file:px-3 file:py-2 file:text-sm file:font-semibold file:text-ozora-ink"
      />
      <button
        type="submit"
        className="rounded-lg bg-ozora-coral px-4 py-2 text-sm font-semibold text-ozora-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow"
      >
        {accountText(language, 'saveAvatar')}
      </button>
      {notice ? (
        <p role="status" className="text-sm text-ozora-yellow">
          {accountNotice(language, notice)}
        </p>
      ) : null}
    </form>
  );
}

function TeamTraces({ traces }: { traces: readonly TeamTrace[] }) {
  const { language } = useLanguage();
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-ozora-cream">{paymentText(language, 'teamTitle')}</h2>
      {traces.length === 0 ? <p className="mt-3 text-sm text-ozora-cream/70">{paymentText(language, 'teamEmpty')}</p> : null}
      {traces.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm text-ozora-cream">
          {traces.map((trace) => (
            <li key={trace.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              {trace.username || paymentText(language, 'unknownAccount')} · {paymentPurposeLabel(language, trace.purpose)} {trace.amount}{' '}
              {trace.currency} · {paymentText(language, 'pending')}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
