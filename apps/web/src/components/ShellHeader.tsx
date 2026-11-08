'use client';

import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { navigation } from '../navigation';

export function ShellHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = (): void => {
    setMenuOpen(false);
  };

  return (
    <header className="safe-top sticky top-0 z-40 border-b border-white/10 bg-ozora-navy/70 backdrop-blur-md">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 md:px-8">
        <a
          href="/"
          onClick={closeMenu}
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow md:hidden"
          aria-label="Home"
        >
          <img
            src="/branding/tropical-nomads-logo-horizontal-cream.png"
            alt="Tropical Nomads"
            className="h-7 w-auto object-contain"
          />
        </a>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-ozora-cream transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise md:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
        >
          {menuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>

        <a
          href="/"
          className="hidden shrink-0 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow md:flex"
          aria-label="Home"
        >
          <img
            src="/branding/tropical-nomads-logo-horizontal-cream.png"
            alt="Tropical Nomads"
            className="h-9 w-auto object-contain"
          />
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {navigation.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-ozora-cream/80 transition hover:bg-white/10 hover:text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      {menuOpen ? (
        <nav
          id="mobile-nav"
          aria-label="Primary mobile"
          className="flex flex-col gap-1 border-t border-white/10 bg-ozora-navy/95 px-5 py-3 md:hidden"
        >
          {navigation.map((item) => (
            <a
              key={item.id}
              href={item.href}
              onClick={closeMenu}
              className="rounded-lg px-3 py-2.5 text-left text-base font-medium text-ozora-cream/80 transition hover:bg-white/10 hover:text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
            >
              {item.label}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
