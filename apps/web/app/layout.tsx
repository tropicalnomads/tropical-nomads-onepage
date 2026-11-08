import type { ReactNode } from 'react';
import '@fontsource-variable/outfit';
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{brandStyleText()}</style>
      </head>
      <body className="font-sans">
        <LanguageProvider>
          <ShellHeader />
          {children}
          <ShellFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}
