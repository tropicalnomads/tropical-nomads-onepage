import { origins } from 'tropical-nomads-shared';
import { navigation } from '../navigation';

export function ShellFooter() {
  return (
    <footer className="safe-bottom border-t border-white/10 px-5 py-8 text-center text-xs text-ozora-cream/70 md:px-8">
      <nav aria-label="Footer" className="mb-4 flex flex-wrap justify-center gap-2">
        {navigation.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className="rounded-full px-3 py-1 transition hover:bg-white/10 hover:text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
          >
            {item.label}
          </a>
        ))}
      </nav>
      <p>Tropical Nomads - made for the dancefloor community.</p>
      <p className="mt-3">
        <a
          href={`${origins.publicSite}/privacy/`}
          className="font-semibold text-ozora-turquoise transition hover:text-ozora-yellow"
        >
          Privacy Policy
        </a>
      </p>
      <p className="mt-1 text-ozora-cream/50">&copy; {new Date().getFullYear()} Tropical Nomads</p>
    </footer>
  );
}
