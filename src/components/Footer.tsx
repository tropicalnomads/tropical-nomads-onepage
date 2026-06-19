interface FooterProps {
  onNavigate: (id: string) => void;
}

const FOOTER_LINKS: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'upcoming-events', label: 'Events' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'partners', label: 'Partners' },
  { id: 'socials', label: 'Socials' },
];

export function Footer({ onNavigate }: FooterProps): JSX.Element {
  return (
    <footer className="safe-x safe-bottom border-t border-white/10 px-5 py-8 text-center text-xs text-ozora-cream/70 md:px-8">
      <nav aria-label="Footer" className="mb-4 flex flex-wrap justify-center gap-2">
        {FOOTER_LINKS.map((link) => (
          <button
            key={link.id}
            type="button"
            onClick={() => onNavigate(link.id)}
            className="rounded-full px-3 py-1 transition hover:bg-white/10 hover:text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
          >
            {link.label}
          </button>
        ))}
      </nav>
      <p>Tropical Nomads - made for the dancefloor community.</p>
      <p className="mt-1 text-ozora-cream/50">
        &copy; {new Date().getFullYear()} Tropical Nomads
      </p>
    </footer>
  );
}
