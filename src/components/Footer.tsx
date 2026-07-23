import { useI18n } from '@/i18n/I18nProvider';
import type { TranslationDict } from '@/i18n/translations';

interface FooterProps {
  onNavigate: (id: string) => void;
}

const FOOTER_LINKS: ReadonlyArray<{ id: string; labelKey: keyof TranslationDict }> = [
  { id: 'home', labelKey: 'navHome' },
  { id: 'upcoming-events', labelKey: 'navEvents' },
  { id: 'gallery', labelKey: 'navGallery' },
  { id: 'partners', labelKey: 'navPartners' },
  { id: 'socials', labelKey: 'navSocials' },
];

export function Footer({ onNavigate }: FooterProps): JSX.Element {
  const { t } = useI18n();
  return (
    <footer className="safe-bottom border-t border-white/10 px-5 py-8 text-center text-xs text-ozora-cream/70 md:px-8">
      <nav aria-label="Footer" className="mb-4 flex flex-wrap justify-center gap-2">
        {FOOTER_LINKS.map((link) => (
          <button
            key={link.id}
            type="button"
            onClick={() => onNavigate(link.id)}
            className="rounded-full px-3 py-1 transition hover:bg-white/10 hover:text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
          >
            {t[link.labelKey] as string}
          </button>
        ))}
      </nav>
      <p>{t.footerTagline}</p>
      <p className="mt-3">
        <a
          href="/privacy/"
          className="font-semibold text-ozora-turquoise transition hover:text-ozora-yellow"
        >
          Privacy Policy
        </a>
      </p>
      <p className="mt-1 text-ozora-cream/50">
        &copy; {new Date().getFullYear()} Tropical Nomads
      </p>
    </footer>
  );
}
