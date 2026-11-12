import type { ReactNode } from 'react';
import { cookies, headers } from 'next/headers';
import '@fontsource-variable/outfit';
import { adminActor } from '../src/admin/actions';
import { readSessionSub, sessionCookieName } from '../src/account/session';
import { brandStyleText } from '../src/brand';
import { stripExtensionAttributes } from '../src/browser/strip-extension-attributes';
import { ShellFooter } from '../src/components/ShellFooter';
import { ShellHeader } from '../src/components/ShellHeader';
import { LanguageProvider } from '../src/i18n/provider';
import { rootMetadata, siteViewport } from '../src/seo/metadata';
import { PublicSearchLinks } from '../src/seo/links';
import { localeFromHeader } from '../src/seo/urls';
import { readShopCartCount, shopCartCountCookie } from '../src/shop/cart';
import './globals.css';

export const metadata = rootMetadata;

export const viewport = siteViewport;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const jar = await cookies();
  const headerList = await headers();
  const urlLanguage = localeFromHeader(headerList.get('x-tn-locale'));
  const initialLanguage = urlLanguage ?? 'en';
  const signedIn = readSessionSub(jar.get(sessionCookieName)?.value) !== undefined;
  const cartCount = readShopCartCount(jar.get(shopCartCountCookie)?.value);
  let admin = false;
  if (signedIn) {
    try {
      admin = (await adminActor()) !== undefined;
    } catch {
      admin = false;
    }
  }
  return (
    <html lang={initialLanguage} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: stripExtensionAttributes }} />
        <style>{brandStyleText()}</style>
        <PublicSearchLinks />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <LanguageProvider initialLanguage={initialLanguage}>
          <div className="flex min-h-dvh flex-col">
            <ShellHeader signedIn={signedIn} admin={admin} cartCount={cartCount} />
            {children}
            <ShellFooter />
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
