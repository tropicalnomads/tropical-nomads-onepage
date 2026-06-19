import { Ticket } from 'lucide-react';

interface SiteHeaderProps {
  onNavigate: (id: string) => void;
}

const NAV_ITEMS: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'upcoming-events', label: 'Events' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'partners', label: 'Partners' },
  { id: 'socials', label: 'Socials' },
];

export function SiteHeader({ onNavigate }: SiteHeaderProps): JSX.Element {
  return (
    <header className="safe-top safe-x sticky top-0 z-40 border-b border-white/10 bg-ozora-navy/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 md:px-8">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex shrink-0 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow"
          aria-label="Tropical Nomads home"
        >
          <img
            src="/branding/tropical-nomads-logo-horizontal-cream.png"
            alt="Tropical Nomads"
            className="h-9 w-auto object-contain"
          />
        </button>

        <nav aria-label="Primary" className="scrollbar-none -mx-1 flex items-center gap-1 overflow-x-auto px-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-ozora-cream/80 transition hover:bg-white/10 hover:text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => onNavigate('upcoming-events')}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-ozora-yellow px-4 py-2 text-sm font-bold text-ozora-ink transition hover:bg-ozora-coral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-ozora-navy"
        >
          <Ticket size={16} aria-hidden="true" />
          <span className="hidden sm:inline">Tickets</span>
        </button>
      </div>
    </header>
  );
}
