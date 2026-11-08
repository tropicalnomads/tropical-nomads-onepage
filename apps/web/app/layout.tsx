import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import '@fontsource-variable/outfit';
import { readSessionSub, sessionCookieName } from '../src/account/session';
import { brandStyleText } from '../src/brand';
import { ShellFooter } from '../src/components/ShellFooter';
import { ShellHeader } from '../src/components/ShellHeader';
import { LanguageProvider } from '../src/i18n/provider';
import './globals.css';

export const metadata = {
  title: 'Tropical Nomads',
  description: 'Tropical Nomads. Psytrance with a Brazilian touch.',
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const jar = await cookies();
  const signedIn = readSessionSub(jar.get(sessionCookieName)?.value) !== undefined;
  return (
    <html lang="en">
      <head>
        <style>{brandStyleText()}</style>
      </head>
      <body className="font-sans">
        <LanguageProvider>
          <ShellHeader signedIn={signedIn} />
          {children}
          <ShellFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}
