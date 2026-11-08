export const locales = ['en', 'pt'] as const;

export type Locale = (typeof locales)[number];

export const languageStorageKey = 'tn:language:v1';

export type AcceptedLocale = { ok: true; locale: Locale } | { ok: false };

export function acceptLocale(value: unknown): AcceptedLocale {
  switch (value) {
    case 'en':
    case 'pt':
      return { ok: true, locale: value };
    default:
      return { ok: false };
  }
}

export function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) {
    return null;
  }
  const lower = value.trim().toLowerCase();
  if (lower.startsWith('pt')) {
    return 'pt';
  }
  if (lower.startsWith('en')) {
    return 'en';
  }
  return null;
}

export function selectLocale(stored: string | null | undefined, device: string | null | undefined): Locale {
  return normalizeLocale(stored) ?? normalizeLocale(device) ?? 'en';
}
