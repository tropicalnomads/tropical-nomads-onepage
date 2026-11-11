'use client';

import { BadgeCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { noticeForProfileFailure } from '../account/profile-failure';
import { accountIdentity, firstProfileField, profileFieldIssues, profileInputFromFormData, type ProfileFieldIssues, type ProfileFieldName } from '../account/profile-form';
import { saveAccountProfileAction } from '../account/profile';
import { authPath, signInHref } from '../account/return-path';
import { useCurrentPath } from '../account/use-return-path';
import { accountText, type AccountNotice } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';
import { AuthFrame, AuthNotice, AuthSubmitButton } from './AuthUi';
import { ProfileFields, type ProfileValues } from './ProfileFields';
import { Button, TextLink } from './ui/Button';

export interface AccountSummary extends ProfileValues {
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
  const here = useCurrentPath();
  if (!profile) {
    return (
      <AuthFrame
        showLogo={false}
        title={accountText(language, 'accountTitle')}
        subtitle={accountText(language, 'intro')}
        footer={
          <TextLink href={authPath('/account/forgot-password', here)} className="text-sm">
            {accountText(language, 'forgotPassword')}
          </TextLink>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Button href={signInHref(here)} className="w-full">
            {accountText(language, 'signIn')}
          </Button>
          <Button href={authPath('/account/register', here)} tone="ghost" className="w-full">
            {accountText(language, 'register')}
          </Button>
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
          <p className="mt-0.5 text-sm text-ozora-cream/55">{accountIdentity(profile)}</p>
        </div>
      </div>
      {profile.status === 'disabled' ? (
        <p className="rounded-xl border border-ozora-yellow/30 bg-ozora-yellow/10 px-4 py-3 text-sm text-ozora-cream">
          {accountText(language, 'disabled')}
        </p>
      ) : null}
      <ProfileFields values={profile} pending={pending || profile.status === 'disabled'} issues={issues} onNotice={setNotice} onClearIssue={clearIssue} />
      {profile.status === 'active' ? (
        <AuthSubmitButton pending={pending}>{accountText(language, 'saveProfile')}</AuthSubmitButton>
      ) : null}
      <AuthNotice notice={notice} />
    </form>
  );
}
