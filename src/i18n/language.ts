import type { Language } from '@/i18n/translations';

const LANGUAGE_KEY = 'tn:language:v1';

function normalizeLanguage(value: string | null | undefined): Language | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower.startsWith('pt')) return 'pt';
  if (lower.startsWith('en')) return 'en';
  return null;
}

export function detectDeviceLanguage(): Language {
  if (typeof navigator === 'undefined') return 'en';

  const preferred = navigator.languages?.find(Boolean) ?? navigator.language;
  const normalized = normalizeLanguage(preferred);
  if (normalized) return normalized;
  return 'en';
}

export function loadStoredLanguage(): Language | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(LANGUAGE_KEY);
    return normalizeLanguage(raw);
  } catch {
    return null;
  }
}

export function saveStoredLanguage(language: Language): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // Ignore storage failures.
  }
}
