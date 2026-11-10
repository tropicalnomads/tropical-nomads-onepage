import type { Metadata, Viewport } from 'next';
import { authorName, documentTitle, imageAlt, indexRobots, keywords, metaDescription, openGraphDescription, openGraphTitle, twitterDescription, twitterSite } from './copy.ts';
import { isPublicPath, localeFromLangParam, siteOrigin, type PublicPath, type SiteLocale } from './urls.ts';

const ogImage = `${siteOrigin}/og-image.png`;

export const siteViewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#042f2e',
};

export const rootMetadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: 'Tropical Nomads',
  applicationName: authorName,
  authors: [{ name: authorName }],
  robots: { index: false, follow: false },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: authorName,
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
  },
};

function openGraphLocale(locale: SiteLocale): 'en_US' | 'pt_BR' {
  switch (locale) {
    case 'en':
      return 'en_US';
    case 'pt':
      return 'pt_BR';
    default: {
      const unexpected: never = locale;
      return unexpected;
    }
  }
}

function alternateLocale(locale: SiteLocale): 'en_US' | 'pt_BR' {
  switch (locale) {
    case 'en':
      return 'pt_BR';
    case 'pt':
      return 'en_US';
    default: {
      const unexpected: never = locale;
      return unexpected;
    }
  }
}

export function publicMetadata(path: PublicPath, lang: string | string[] | null | undefined): Metadata {
  const locale = localeFromLangParam(lang);
  if (!isPublicPath(path)) {
    const unexpected: never = path;
    return unexpected;
  }
  return {
    title: { absolute: documentTitle },
    description: metaDescription,
    keywords,
    applicationName: authorName,
    authors: [{ name: authorName }],
    robots: indexRobots,
    openGraph: {
      type: 'website',
      siteName: authorName,
      locale: openGraphLocale(locale),
      alternateLocale: [alternateLocale(locale)],
      title: openGraphTitle,
      description: openGraphDescription,
      images: [
        {
          url: ogImage,
          secureUrl: ogImage,
          type: 'image/png',
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: openGraphTitle,
      description: twitterDescription,
      site: twitterSite,
      images: [{ url: ogImage, alt: imageAlt, secureUrl: ogImage }],
    },
    other: {
      googlebot: indexRobots,
    },
  };
}
