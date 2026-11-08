import { languageStorageKey, type Locale } from 'tropical-nomads-shared';

export function deviceLanguage(): string | null {
  if (typeof navigator === 'undefined') {
    return null;
  }
  return navigator.languages?.find(Boolean) ?? navigator.language ?? null;
}

export function readStoredLanguage(): string | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    return window.localStorage.getItem(languageStorageKey);
  } catch {
    return null;
  }
}

export function storeLocale(locale: Locale): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.setItem(languageStorageKey, locale);
  } catch {
    // Storage can be blocked. The choice still applies for this view.
  }
}
