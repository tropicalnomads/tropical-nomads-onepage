'use client';

import { ChevronDown } from 'lucide-react';
import { locales, type Locale } from 'tropical-nomads-shared';
import { useEffect, useId, useMemo, useRef, useState, type SVGProps } from 'react';
import { switchLanguageLabel } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';

function UkFlag({ clipId, ...props }: SVGProps<SVGSVGElement> & { clipId: string }) {
  return (
    <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" {...props}>
      <clipPath id={clipId}>
        <rect width="60" height="40" rx="4" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect width="60" height="40" fill="#012169" />
        <polygon points="0,0 7,0 60,32 60,40 53,40 0,8" fill="#FFF" />
        <polygon points="60,0 53,0 0,32 0,40 7,40 60,8" fill="#FFF" />
        <polygon points="0,0 3.5,0 60,34 60,40 56.5,40 0,6" fill="#C8102E" />
        <polygon points="60,0 56.5,0 0,34 0,40 3.5,40 60,6" fill="#C8102E" />
        <rect x="24" width="12" height="40" fill="#FFF" />
        <rect y="14" width="60" height="12" fill="#FFF" />
        <rect x="26" width="8" height="40" fill="#C8102E" />
        <rect y="16" width="60" height="8" fill="#C8102E" />
      </g>
    </svg>
  );
}

function BrFlag(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="60" height="40" rx="4" fill="#009739" />
      <polygon points="30,6 52,20 30,34 8,20" fill="#FEDD00" />
      <circle cx="30" cy="20" r="8.5" fill="#012169" />
      <path d="M21.5 20.2c2.8-2 6-3 8.5-3 3 0 5.8.8 8.8 2.7" stroke="#FFF" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function optionLabel(locale: Locale): string {
  switch (locale) {
    case 'en':
      return 'EN';
    case 'pt':
      return 'PT';
    default: {
      const unexpected: never = locale;
      return unexpected;
    }
  }
}

function Flag({ locale, clipId }: { locale: Locale; clipId: string }) {
  switch (locale) {
    case 'en':
      return <UkFlag clipId={clipId} aria-hidden className="h-3.5 w-5 rounded-sm shadow-sm" />;
    case 'pt':
      return <BrFlag aria-hidden className="h-3.5 w-5 rounded-sm shadow-sm" />;
    default: {
      const unexpected: never = locale;
      return unexpected;
    }
  }
}

export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const clipBase = useId();
  const activeLabel = optionLabel(language);
  const active = useMemo(
    () => locales.find((locale) => locale === language) ?? locales[0],
    [language],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const handlePointerDown = (event: MouseEvent | TouchEvent): void => {
      if (!(event.target instanceof Node)) {
        return;
      }
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('touchstart', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={switchLanguageLabel(language, activeLabel)}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[11px] font-bold text-ozora-cream sm:hidden"
      >
        <Flag locale={active} clipId={`${clipBase}-active`} />
        <span>{activeLabel}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-[80] mt-1.5 w-28 rounded-xl border border-white/10 bg-ozora-navy/95 p-1.5 shadow-2xl backdrop-blur sm:hidden">
          {locales.map((locale) => {
            const label = optionLabel(locale);
            const selected = locale === language;
            return (
              <button
                key={locale}
                type="button"
                onClick={() => {
                  setLanguage(locale);
                  setOpen(false);
                }}
                className={`mb-1 inline-flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[11px] font-bold transition last:mb-0 ${
                  selected
                    ? 'bg-ozora-yellow text-ozora-ink'
                    : 'text-ozora-cream/80 hover:bg-white/10 hover:text-ozora-cream'
                }`}
                aria-pressed={selected}
                aria-label={switchLanguageLabel(language, label)}
              >
                <Flag locale={locale} clipId={`${clipBase}-menu-${locale}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="hidden items-center gap-1 rounded-full border border-white/15 bg-white/5 p-1 sm:inline-flex">
        {locales.map((locale) => {
          const label = optionLabel(locale);
          const selected = locale === language;
          return (
            <button
              key={locale}
              type="button"
              onClick={() => setLanguage(locale)}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold transition ${
                selected
                  ? 'bg-ozora-yellow text-ozora-ink'
                  : 'text-ozora-cream/80 hover:bg-white/10 hover:text-ozora-cream'
              }`}
              aria-pressed={selected}
              aria-label={switchLanguageLabel(language, label)}
            >
              <Flag locale={locale} clipId={`${clipBase}-bar-${locale}`} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
