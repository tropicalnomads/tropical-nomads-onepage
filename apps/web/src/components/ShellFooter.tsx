'use client';

import { origins } from 'tropical-nomads-shared';
import { areaText, shellText } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';
import { navigation } from '../navigation';
import { publicHref } from '../seo/urls';
import { LanguageSwitch } from './LanguageSwitch';
import { TextLink } from './ui/Button';

export function ShellFooter() {
  const { language } = useLanguage();

  return (
    <footer className="safe-bottom mt-auto border-t border-white/10 px-5 py-8 text-center text-xs text-ozora-cream/70 md:px-8">
      <nav aria-label={shellText(language, 'footer')} className="mb-4 flex flex-wrap justify-center gap-2">
        {navigation.map((item) => (
          <a
            key={item.id}
            href={publicHref(item.href, language)}
            className="rounded-full px-3 py-1 transition hover:bg-white/10 hover:text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
          >
            {areaText(language, item.id)}
          </a>
        ))}
      </nav>
      <div className="mb-5 flex justify-center">
        <LanguageSwitch />
      </div>
      <p>{shellText(language, 'footerTagline')}</p>
      <p className="mt-3">
        <TextLink href={`${origins.publicSite}/privacy/`}>
          {shellText(language, 'privacy')}
        </TextLink>
      </p>
      <p className="mt-1 text-ozora-cream/50">&copy; {new Date().getFullYear()} Tropical Nomads</p>
    </footer>
  );
}
