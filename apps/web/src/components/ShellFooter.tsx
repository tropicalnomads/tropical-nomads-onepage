'use client';

import { origins } from 'tropical-nomads-shared';
import { areaText, shellText } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';
import { navigation } from '../navigation';

export function ShellFooter() {
  const { language } = useLanguage();

  return (
    <footer className="safe-bottom border-t border-white/10 px-5 py-8 text-center text-xs text-ozora-cream/70 md:px-8">
      <nav aria-label={shellText(language, 'footer')} className="mb-4 flex flex-wrap justify-center gap-2">
        {navigation.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className="rounded-full px-3 py-1 transition hover:bg-white/10 hover:text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
          >
            {areaText(language, item.id)}
          </a>
        ))}
      </nav>
      <p>{shellText(language, 'footerTagline')}</p>
      <p className="mt-3">
        <a
          href={`${origins.publicSite}/privacy/`}
          className="font-semibold text-ozora-turquoise transition hover:text-ozora-yellow"
        >
          {shellText(language, 'privacy')}
        </a>
      </p>
      <p className="mt-1 text-ozora-cream/50">&copy; {new Date().getFullYear()} Tropical Nomads</p>
    </footer>
  );
}
