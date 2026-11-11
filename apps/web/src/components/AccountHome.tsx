'use client';

import { BadgeCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { noticeForProfileFailure } from '../account/profile-failure';
import { saveAccountProfileAction } from '../account/profile';
import { accountText, type AccountNotice } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';
import { AuthFrame, AuthNotice, AuthSubmitButton } from './AuthUi';
import { ProfileFields, type ProfileValues } from './ProfileFields';

export interface AccountSummary extends ProfileValues {
  username: string;
  email: string;
  status: 'active' | 'disabled';
}

export function AccountHome({
  profile,
  initialNotice = null,
}: {
  profile: AccountSummary | null;
  initialNotice?: AccountNotice | null;
}) {
  const { language } = useLanguage();
  if (!profile) {
    return (
      <AuthFrame
        showLogo={false}
        title={accountText(language, 'accountTitle')}
        subtitle={accountText(language, 'intro')}
        footer={
          <a
            href="/account/forgot-password"
            className="text-sm font-bold text-ozora-turquoise underline-offset-4 transition hover:text-ozora-yellow hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
          >
            {accountText(language, 'forgotPassword')}
          </a>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href="/account/sign-in"
            className="rounded-xl bg-ozora-green px-5 py-3 text-center text-sm font-bold text-ozora-ink transition hover:-translate-y-0.5 hover:bg-ozora-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow"
          >
            {accountText(language, 'signIn')}
          </a>
          <a
            href="/account/register"
            className="rounded-xl border border-white/15 bg-white/[0.05] px-5 py-3 text-center text-sm font-bold text-ozora-cream transition hover:border-ozora-turquoise/50 hover:bg-ozora-turquoise/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
          >
            {accountText(language, 'register')}
          </a>
        </div>
      </AuthFrame>
    );
  }
  return (
    <AuthFrame
      showLogo={false}
      wide
      title={accountText(language, 'accountTitle')}
      subtitle={accountText(language, 'intro')}
    >
      <AccountProfileForm profile={profile} initialNotice={initialNotice} />
    </AuthFrame>
  );
}

function AccountProfileForm({
  profile,
  initialNotice,
}: {
  profile: AccountSummary;
  initialNotice: AccountNotice | null;
}) {
  const { language } = useLanguage();
  const [notice, setNotice] = useState<AccountNotice | null>(initialNotice);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setPending(true);
    setNotice(null);
    try {
      const result = await saveAccountProfileAction(new FormData(event.currentTarget));
      if (result.notice === 'profile-saved') {
        window.location.assign('/account?notice=profile-saved');
        return;
      }
      setNotice(result.notice ?? 'profile-invalid');
    } catch (error) {
      setNotice(noticeForProfileFailure(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-7" encType="multipart/form-data" noValidate aria-busy={pending}>
      <div className="flex items-start gap-3 rounded-2xl border border-ozora-turquoise/20 bg-ozora-turquoise/[0.08] p-4">
        <BadgeCheck size={21} aria-hidden="true" className="mt-0.5 shrink-0 text-ozora-turquoise" />
        <div className="min-w-0">
          <p className="truncate font-bold text-ozora-cream">{profile.email}</p>
          <p className="mt-0.5 text-sm text-ozora-cream/55">@{profile.username}</p>
        </div>
      </div>
      {profile.status === 'disabled' ? (
        <p className="rounded-xl border border-ozora-yellow/30 bg-ozora-yellow/10 px-4 py-3 text-sm text-ozora-cream">
          {accountText(language, 'disabled')}
        </p>
      ) : null}
      <ProfileFields values={profile} pending={pending || profile.status === 'disabled'} onNotice={setNotice} />
      {profile.status === 'active' ? (
        <AuthSubmitButton pending={pending}>{accountText(language, 'saveProfile')}</AuthSubmitButton>
      ) : null}
      <AuthNotice notice={notice} />
    </form>
  );
}
