'use client';

import {
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import {
  useId,
  useState,
  type HTMLInputAutoCompleteAttribute,
  type ReactNode,
} from 'react';
import { passwordChecks } from 'tropical-nomads-shared';
import { accountNotice, accountText, type AccountNotice } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';

const controlClass =
  'h-12 w-full rounded-xl border border-white/15 bg-black/30 pl-11 pr-4 text-base text-ozora-cream shadow-inner outline-none transition placeholder:text-ozora-cream/30 hover:border-white/25 focus:border-ozora-turquoise/70 focus:bg-black/40 focus-visible:ring-2 focus-visible:ring-ozora-turquoise/40 disabled:cursor-not-allowed disabled:opacity-60 md:h-11 md:text-sm';

interface AuthFrameProps {
  eyebrow?: string;
  showLogo?: boolean;
  wide?: boolean;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthFrame({ eyebrow, showLogo = true, wide = false, title, subtitle, children, footer }: AuthFrameProps) {
  return (
    <main className="relative isolate overflow-hidden">
      <section className="relative px-5 py-10 md:px-8 md:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-8 h-72 w-72 -translate-x-1/2 rounded-full bg-ozora-turquoise/15 blur-3xl md:h-96 md:w-96"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-[8%] h-64 w-64 rounded-full bg-ozora-pink/10 blur-3xl"
        />

        <div className={`relative mx-auto overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.08] via-black/25 to-black/40 shadow-2xl backdrop-blur-xl ${wide ? 'max-w-3xl' : 'max-w-xl'}`}>
          <div className="h-px bg-gradient-to-r from-transparent via-ozora-yellow/70 to-transparent" />
          <div className="p-6 sm:p-8 md:p-10">
            {showLogo ? (
              <a
                href="/"
                className="mx-auto flex w-fit rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow"
              >
                <img
                  src="/branding/tropical-nomads-logo-horizontal-cream.png"
                  alt="Tropical Nomads"
                  className="h-12 w-auto object-contain sm:h-14"
                />
              </a>
            ) : null}

            <div className={showLogo ? 'mt-7 text-center' : 'text-center'}>
              {eyebrow ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-ozora-turquoise/25 bg-ozora-turquoise/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-ozora-turquoise">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-ozora-turquoise shadow-[0_0_10px_rgba(46,196,182,0.9)]" />
                  {eyebrow}
                </div>
              ) : null}
              <h1 className={`${eyebrow ? 'mt-4 ' : ''}text-3xl font-bold tracking-tight text-ozora-cream sm:text-4xl`}>{title}</h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ozora-cream/65 sm:text-base">{subtitle}</p>
            </div>

            <div className="mt-8">{children}</div>

            {footer ? <div className="mt-8 border-t border-white/10 pt-6 text-center">{footer}</div> : null}
          </div>
        </div>
      </section>
    </main>
  );
}

interface AuthFieldProps {
  label: ReactNode;
  name: string;
  icon: LucideIcon;
  type?: 'email' | 'tel' | 'text';
  autoComplete?: HTMLInputAutoCompleteAttribute;
  inputMode?: 'email' | 'numeric' | 'tel' | 'text';
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  defaultValue?: string;
  autoFocus?: boolean;
  maxLength?: number;
  placeholder?: string;
}

export function AuthField({
  label,
  name,
  icon: Icon,
  type = 'text',
  autoComplete,
  inputMode,
  required = false,
  disabled = false,
  readOnly = false,
  defaultValue,
  autoFocus = false,
  maxLength,
  placeholder,
}: AuthFieldProps) {
  const id = useId();

  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block text-sm font-semibold text-ozora-cream/80">{label}</span>
      <span className="relative block">
        <Icon
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ozora-turquoise/80"
        />
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          inputMode={inputMode}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          defaultValue={defaultValue}
          autoFocus={autoFocus}
          maxLength={maxLength}
          placeholder={placeholder}
          className={controlClass}
        />
      </span>
    </label>
  );
}

interface PasswordFieldProps {
  label: string;
  name?: string;
  autoComplete: 'current-password' | 'new-password';
  disabled?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function PasswordField({
  label,
  name = 'password',
  autoComplete,
  disabled = false,
  value,
  onValueChange,
}: PasswordFieldProps) {
  const { language } = useLanguage();
  const id = useId();
  const [visible, setVisible] = useState(false);
  const toggleLabel = accountText(language, visible ? 'hidePassword' : 'showPassword');

  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block text-sm font-semibold text-ozora-cream/80">{label}</span>
      <span className="relative block">
        <ShieldCheck
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ozora-turquoise/80"
        />
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          minLength={8}
          disabled={disabled}
          value={value}
          onChange={onValueChange ? (event) => onValueChange(event.target.value) : undefined}
          className={`${controlClass} pr-12`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          aria-label={toggleLabel}
          title={toggleLabel}
          className="absolute right-2.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ozora-cream/55 transition hover:bg-white/10 hover:text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise disabled:opacity-40"
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </span>
    </label>
  );
}

export function PasswordGuide({ password, confirmation }: { password: string; confirmation: string }) {
  const { language } = useLanguage();
  const checks = passwordChecks(password);
  const rules = [
    { met: checks.length, label: accountText(language, 'passwordRuleLength') },
    { met: checks.uppercase, label: accountText(language, 'passwordRuleUpper') },
    { met: checks.lowercase, label: accountText(language, 'passwordRuleLower') },
    { met: checks.number, label: accountText(language, 'passwordRuleNumber') },
    { met: checks.symbol, label: accountText(language, 'passwordRuleSymbol') },
  ];
  const score = rules.filter((rule) => rule.met).length;
  const strength = score <= 1 ? 'strengthWeak' : score <= 3 ? 'strengthFair' : score === 4 ? 'strengthGood' : 'strengthStrong';
  const bar = score <= 1 ? 'bg-ozora-coral' : score <= 3 ? 'bg-ozora-yellow' : score === 4 ? 'bg-ozora-turquoise' : 'bg-ozora-green';
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-ozora-cream/50">{accountText(language, strength)}</p>
        <p className={`text-xs font-bold ${score === 5 ? 'text-ozora-green' : 'text-ozora-cream/70'}`}>{score}/5</p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
        <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${(score / 5) * 100}%` }} />
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {rules.map((rule) => (
          <li key={rule.label} className={`flex items-center gap-2 text-sm ${rule.met ? 'text-ozora-green' : 'text-ozora-cream/45'}`}>
            <Check size={14} aria-hidden="true" className={rule.met ? 'opacity-100' : 'opacity-30'} />
            <span>{rule.label}</span>
          </li>
        ))}
      </ul>
      {confirmation.length > 0 && password !== confirmation ? (
        <p className="mt-3 text-sm font-semibold text-ozora-yellow">{accountNotice(language, 'password-mismatch')}</p>
      ) : null}
    </div>
  );
}

export function AuthSubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  const { language } = useLanguage();

  return (
    <button
      type="submit"
      disabled={pending}
      className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ozora-green px-5 text-sm font-bold text-ozora-ink shadow-[0_12px_28px_rgba(0,155,119,0.22)] transition hover:-translate-y-0.5 hover:bg-ozora-yellow hover:shadow-[0_16px_32px_rgba(250,208,46,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-ozora-navy disabled:cursor-wait disabled:translate-y-0 disabled:opacity-65"
    >
      <span>{pending ? accountText(language, 'working') : children}</span>
      <ArrowRight
        size={17}
        aria-hidden="true"
        className={`transition-transform ${pending ? 'animate-pulse' : 'group-hover:translate-x-0.5'}`}
      />
    </button>
  );
}

export function AuthDivider() {
  const { language } = useLanguage();

  return (
    <div className="flex items-center gap-3 py-1" aria-hidden="true">
      <span className="h-px flex-1 bg-white/10" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ozora-cream/40">
        {accountText(language, 'orContinueWith')}
      </span>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.19-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.86A6.02 6.02 0 0 1 6.08 12c0-.65.11-1.28.31-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.48l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 6.01c1.47 0 2.79.5 3.82 1.5l2.88-2.88A9.68 9.68 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01Z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-current">
      <path d="M17.05 12.54c.02-2.14 1.75-3.17 1.83-3.22a3.92 3.92 0 0 0-3.09-1.67c-1.3-.14-2.56.78-3.22.78-.67 0-1.69-.76-2.78-.74a4.1 4.1 0 0 0-3.45 2.1c-1.49 2.57-.38 6.35 1.05 8.43.72 1.03 1.56 2.18 2.65 2.14 1.07-.04 1.47-.69 2.77-.69 1.29 0 1.67.69 2.79.66 1.15-.02 1.88-1.02 2.57-2.06a8.35 8.35 0 0 0 1.18-2.4 3.68 3.68 0 0 1-2.3-3.33ZM14.94 6.27a3.75 3.75 0 0 0 .86-2.7 3.82 3.82 0 0 0-2.48 1.28 3.58 3.58 0 0 0-.89 2.6 3.16 3.16 0 0 0 2.51-1.18Z" />
    </svg>
  );
}

interface ProviderButtonsProps {
  onProvider: (provider: 'google' | 'apple') => void;
  pendingProvider: 'google' | 'apple' | null;
}

export function ProviderButtons({ onProvider, pendingProvider }: ProviderButtonsProps) {
  const { language } = useLanguage();
  const disabled = pendingProvider !== null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => onProvider('google')}
        disabled={disabled}
        className="inline-flex h-12 items-center justify-center gap-3 rounded-xl border border-[#dadce0] bg-white px-4 text-sm font-semibold text-[#202124] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f8fafd] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise disabled:cursor-wait disabled:translate-y-0 disabled:opacity-60"
      >
        <GoogleIcon />
        <span>{pendingProvider === 'google' ? accountText(language, 'working') : accountText(language, 'continueGoogle')}</span>
      </button>
      <button
        type="button"
        onClick={() => onProvider('apple')}
        disabled={disabled}
        className="inline-flex h-12 items-center justify-center gap-3 rounded-xl border border-white/20 bg-black px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:border-white/40 hover:bg-[#111] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise disabled:cursor-wait disabled:translate-y-0 disabled:opacity-60"
      >
        <AppleIcon />
        <span>{pendingProvider === 'apple' ? accountText(language, 'working') : accountText(language, 'continueApple')}</span>
      </button>
    </div>
  );
}

export function AuthNotice({ notice }: { notice: AccountNotice | null | undefined }) {
  const { language } = useLanguage();
  if (!notice) {
    return null;
  }
  const positive = notice === 'reset-sent' || notice === 'password-reset' || notice === 'avatar-saved' || notice === 'account-confirmed' || notice === 'code-sent';

  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed ${
        positive
          ? 'border-ozora-green/35 bg-ozora-green/10 text-ozora-cream'
          : 'border-ozora-yellow/35 bg-ozora-yellow/10 text-ozora-cream'
      }`}
    >
      <CheckCircle2
        size={18}
        aria-hidden="true"
        className={`mt-0.5 shrink-0 ${positive ? 'text-ozora-green' : 'text-ozora-yellow'}`}
      />
      <span>{accountNotice(language, notice)}</span>
    </div>
  );
}
