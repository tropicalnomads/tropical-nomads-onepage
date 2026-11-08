'use client';

import { acceptLocale, selectLocale, type Locale } from 'tropical-nomads-shared';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { deviceLanguage, readStoredLanguage, storeLocale } from './storage';

interface LanguageContextValue {
  language: Locale;
  setLanguage: (language: Locale) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Locale>('en');

  useEffect(() => {
    const next = selectLocale(readStoredLanguage(), deviceLanguage());
    setLanguageState(next);
    document.documentElement.lang = next;
  }, []);

  const setLanguage = (nextLanguage: Locale): void => {
    const accepted = acceptLocale(nextLanguage);
    if (!accepted.ok) {
      return;
    }
    setLanguageState(accepted.locale);
    storeLocale(accepted.locale);
    document.documentElement.lang = accepted.locale;
  };

  const value = useMemo<LanguageContextValue>(() => ({ language, setLanguage }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
