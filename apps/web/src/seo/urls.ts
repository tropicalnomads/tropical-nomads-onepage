export const siteOrigin = 'https://dev.tropical-nomads.com';

export const publicPaths = ['/', '/upcoming-events', '/shop'] as const;

export type PublicPath = (typeof publicPaths)[number];

export const siteLocales = ['en', 'pt'] as const;

export type SiteLocale = (typeof siteLocales)[number];

export function isPublicPath(path: string): path is PublicPath {
  switch (path) {
    case '/':
    case '/upcoming-events':
    case '/shop':
      return true;
    default:
      return false;
  }
}

export function localeFromLangParam(lang: string | string[] | null | undefined): SiteLocale {
  const value = Array.isArray(lang) ? lang[0] : lang;
  switch (value) {
    case 'pt':
      return 'pt';
    default:
      return 'en';
  }
}

export function localeFromHeader(value: string | null): SiteLocale | null {
  switch (value) {
    case 'en':
    case 'pt':
      return value;
    default:
      return null;
  }
}

export function englishUrl(path: PublicPath): string {
  switch (path) {
    case '/':
      return `${siteOrigin}/`;
    case '/upcoming-events':
    case '/shop':
      return `${siteOrigin}${path}`;
    default: {
      const unexpected: never = path;
      return unexpected;
    }
  }
}

export function portugueseUrl(path: PublicPath): string {
  return `${englishUrl(path)}?lang=pt`;
}

export function canonicalUrl(path: PublicPath, lang: string | string[] | null | undefined): string {
  const locale = localeFromLangParam(lang);
  switch (locale) {
    case 'pt':
      return portugueseUrl(path);
    case 'en':
      return englishUrl(path);
    default: {
      const unexpected: never = locale;
      return unexpected;
    }
  }
}

export function searchLinks(path: PublicPath, lang: string | string[] | null | undefined): {
  canonical: string;
  english: string;
  portuguese: string;
} {
  return {
    canonical: canonicalUrl(path, lang),
    english: englishUrl(path),
    portuguese: portugueseUrl(path),
  };
}

export function publicHref(path: string, language: SiteLocale): string {
  if (!isPublicPath(path)) {
    return path;
  }
  switch (language) {
    case 'pt':
      return path === '/' ? '/?lang=pt' : `${path}?lang=pt`;
    case 'en':
      return path;
    default: {
      const unexpected: never = language;
      return unexpected;
    }
  }
}

export function absoluteAsset(value: string): string {
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  return `${siteOrigin}${value}`;
}
