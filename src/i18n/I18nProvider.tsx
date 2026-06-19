import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { detectDeviceLanguage, loadStoredLanguage, saveStoredLanguage } from '@/i18n/language';
import { translations, type Language, type TranslationDict } from '@/i18n/translations';

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: TranslationDict;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => loadStoredLanguage() ?? detectDeviceLanguage());

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    saveStoredLanguage(nextLanguage);
  };

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t: translations[language],
    }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
