import { Menu, Ticket, X } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import type { TranslationDict } from '@/i18n/translations';
import { LanguageSelector } from '@/components/LanguageSelector';

interface SiteHeaderProps {
  onNavigate: (id: string) => void;
}

const NAV_ITEMS: ReadonlyArray<{ id: string; labelKey: keyof TranslationDict }> = [
  { id: 'home', labelKey: 'navHome' },
  { id: 'upcoming-events', labelKey: 'navEvents' },
  { id: 'gallery', labelKey: 'navGallery' },
  { id: 'partners', labelKey: 'navPartners' },
  { id: 'socials', labelKey: 'navSocials' },
];

export function SiteHeader({ onNavigate }: SiteHeaderProps): JSX.Element {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavigate = (id: string): void => {
    onNavigate(id);
    setMenuOpen(false);
  };

  return (
    <header className="safe-top sticky top-0 z-40 border-b border-white/10 bg-ozora-navy/70 backdrop-blur-md">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 md:px-8">
        <button
          type="button"
          onClick={() => handleNavigate('home')}
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow md:hidden"
          aria-label={t.homeAria}
        >
          <img
            src="/branding/tropical-nomads-logo-horizontal-cream.png"
            alt="Tropical Nomads"
            className="h-7 w-auto object-contain"
          />
        </button>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-ozora-cream transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise md:hidden"
          aria-label={menuOpen ? t.closeMenuAria : t.openMenuAria}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
        >
          {menuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>

        <button
          type="button"
          onClick={() => handleNavigate('home')}
          className="hidden shrink-0 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow md:flex"
          aria-label={t.homeAria}
        >
          <img
            src="/branding/tropical-nomads-logo-horizontal-cream.png"
            alt="Tropical Nomads"
            className="h-9 w-auto object-contain"
          />
        </button>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigate(item.id)}
              className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-ozora-cream/80 transition hover:bg-white/10 hover:text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
            >
              {t[item.labelKey] as string}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSelector />
        </div>
      </div>

      {menuOpen ? (
        <nav
          id="mobile-nav"
          aria-label="Primary mobile"
          className="flex flex-col gap-1 border-t border-white/10 bg-ozora-navy/95 px-5 py-3 md:hidden"
        >
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigate(item.id)}
              className="rounded-lg px-3 py-2.5 text-left text-base font-medium text-ozora-cream/80 transition hover:bg-white/10 hover:text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
            >
              {t[item.labelKey] as string}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleNavigate('upcoming-events')}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-ozora-yellow px-4 py-2.5 text-sm font-bold text-ozora-ink transition hover:bg-ozora-coral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow"
          >
            <Ticket size={16} aria-hidden="true" />
            {t.tickets}
          </button>
        </nav>
      ) : null}
    </header>
  );
}
