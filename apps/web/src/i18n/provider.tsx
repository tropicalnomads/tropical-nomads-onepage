'use client';

import { acceptLocale, selectLocale, type Locale } from 'tropical-nomads-shared';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isPublicPath, localeFromLangParam } from '../seo/urls';
import { deviceLanguage, readStoredLanguage, storeLocale } from './storage';

interface LanguageContextValue {
  language: Locale;
  setLanguage: (language: Locale) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ initialLanguage, children }: { initialLanguage: Locale; children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const publicLanguage = isPublicPath(pathname) ? localeFromLangParam(searchParams.get('lang')) : null;
  const [privateLanguage, setPrivateLanguage] = useState<Locale>(initialLanguage);
  const language = publicLanguage ?? privateLanguage;

  useEffect(() => {
    if (publicLanguage) {
      document.documentElement.lang = publicLanguage;
      storeLocale(publicLanguage);
      return;
    }
    const next = selectLocale(readStoredLanguage(), deviceLanguage());
    setPrivateLanguage(next);
    document.documentElement.lang = next;
  }, [publicLanguage]);

  const setLanguage = useCallback(
    (nextLanguage: Locale): void => {
      const accepted = acceptLocale(nextLanguage);
      if (!accepted.ok) {
        return;
      }
      storeLocale(accepted.locale);
      document.documentElement.lang = accepted.locale;
      if (isPublicPath(pathname)) {
        const url = new URL(window.location.href);
        switch (accepted.locale) {
          case 'pt':
            url.searchParams.set('lang', 'pt');
            break;
          case 'en':
            url.searchParams.delete('lang');
            break;
          default: {
            const unexpected: never = accepted.locale;
            throw new Error(unexpected);
          }
        }
        const next = `${url.pathname}${url.search}`;
        if (next !== `${window.location.pathname}${window.location.search}`) {
          router.push(next);
        }
        return;
      }
      setPrivateLanguage(accepted.locale);
    },
    [pathname, router],
  );

  const value = useMemo<LanguageContextValue>(() => ({ language, setLanguage }), [language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
