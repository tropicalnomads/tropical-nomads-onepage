'use client';

import { AlertTriangle, BadgeCheck } from 'lucide-react';
import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent, type FormEvent, type KeyboardEvent } from 'react';
import { deleteAccountAction } from '../account/delete-account';
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
import { fieldControlClass } from './ui/field';

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
      <DeleteAccountForm email={profile.email} />
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

function blockClipboard(event: ClipboardEvent | DragEvent): void {
  event.preventDefault();
}

function blockInsertedPaste(event: FormEvent<HTMLInputElement>): void {
  const native = event.nativeEvent;
  if (!(native instanceof InputEvent)) {
    return;
  }
  if (native.inputType === 'insertFromPaste' || native.inputType === 'insertFromDrop') {
    event.preventDefault();
  }
}

function blockPasteKeys(event: KeyboardEvent<HTMLInputElement>): void {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') {
    event.preventDefault();
  }
  if (event.shiftKey && event.key === 'Insert') {
    event.preventDefault();
  }
}

function DeleteAccountForm({ email }: { email: string }) {
  const { language } = useLanguage();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [typedEmail, setTypedEmail] = useState('');
  const [notice, setNotice] = useState<AccountNotice | null>(null);
  const [pending, setPending] = useState(false);
  const emailMatches = email.trim() !== '' && typedEmail.trim().toLowerCase() === email.trim().toLowerCase();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
      emailRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function openDialog(): void {
    setConfirmed(false);
    setTypedEmail('');
    setNotice(null);
    setOpen(true);
  }

  function closeDialog(): void {
    if (pending) {
      return;
    }
    setOpen(false);
    setConfirmed(false);
    setTypedEmail('');
    setNotice(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    if (!confirmed) {
      setNotice('account-delete-unconfirmed');
      return;
    }
    if (!emailMatches) {
      setNotice('account-delete-email');
      emailRef.current?.focus();
      return;
    }
    setPending(true);
    setNotice(null);
    try {
      const result = await deleteAccountAction(new FormData(form));
      if (result.redirect) {
        window.location.assign(result.redirect);
        return;
      }
      setNotice(result.notice ?? 'account-delete-failed');
    } catch {
      setNotice('account-delete-failed');
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="mt-8 border-t border-white/10 pt-6">
        <Button type="button" tone="ghost" onClick={openDialog}>
          {accountText(language, 'deleteAccount')}
        </Button>
      </div>
      <dialog
        ref={dialogRef}
        aria-labelledby="delete-account-title"
        onCancel={(event) => {
          event.preventDefault();
          closeDialog();
        }}
        className="m-auto max-h-[90vh] w-[min(92vw,31rem)] overflow-y-auto rounded-[2rem] border border-ozora-coral/30 bg-ozora-navy p-0 text-ozora-cream shadow-[0_30px_120px_rgba(0,0,0,0.7)] backdrop:bg-black/80"
      >
        <form onSubmit={onSubmit} className="p-7" autoComplete="off" aria-busy={pending}>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ozora-coral/10 text-ozora-coral">
            <AlertTriangle size={26} aria-hidden="true" />
          </span>
          <h2 id="delete-account-title" className="mt-5 font-display text-3xl font-bold">
            {accountText(language, 'deleteAccount')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ozora-cream/60">{accountText(language, 'deleteAccountHelp')}</p>
          <p className="mt-5 text-sm text-ozora-cream/70">{accountText(language, 'deleteAccountTypeEmail')}</p>
          <p className="mt-2 select-none font-bold text-ozora-cream" onCopy={blockClipboard} onCut={blockClipboard}>
            {email}
          </p>
          <label htmlFor="delete-account-email" className="mt-4 block text-sm text-ozora-cream/70">
            {accountText(language, 'deleteAccountEmailLabel')}
          </label>
          <input
            id="delete-account-email"
            ref={emailRef}
            name="email"
            type="email"
            value={typedEmail}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            onChange={(event) => setTypedEmail(event.target.value)}
            onPaste={blockClipboard}
            onDrop={blockClipboard}
            onBeforeInput={blockInsertedPaste}
            onKeyDown={blockPasteKeys}
            className={`${fieldControlClass} mt-2`}
          />
          <label className="mt-5 flex items-start gap-3 text-sm leading-relaxed text-ozora-cream">
            <input
              name="confirm"
              value="delete"
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-1 shrink-0 accent-ozora-turquoise"
            />
            <span>{accountText(language, 'deleteAccountConfirm')}</span>
          </label>
          <AuthNotice notice={notice} />
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" tone="ghost" disabled={pending} onClick={closeDialog}>
              {accountText(language, 'deleteAccountCancel')}
            </Button>
            <Button type="submit" tone="secondary" disabled={pending || !confirmed || !emailMatches}>
              {pending ? accountText(language, 'working') : accountText(language, 'deleteAccountButton')}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
