'use client';

import { LogIn, Menu, ShoppingBag, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { origins, type Locale, type WebAreaId } from 'tropical-nomads-shared';
import { accountText, areaText, shellText } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';
import { shopText } from '../i18n/shop-copy';
import { navigation } from '../navigation';
import { useShopCart } from '../shop/useShopCart';
import { LanguageSwitch } from './LanguageSwitch';

const navLinkClass =
  'shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-ozora-cream/80 transition hover:bg-white/10 hover:text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise';

function headerLabel(language: Locale, id: WebAreaId): string {
  if (id === 'upcoming-events') {
    return shellText(language, 'calendar');
  }
  return areaText(language, id);
}

function BookingsLink({ menu, onClick }: { menu?: boolean; onClick?: () => void }) {
  const { language } = useLanguage();
  return (
    <a
      href={origins.bookings}
      onClick={onClick}
      className={
        menu
          ? 'rounded-lg px-3 py-2.5 text-left text-base font-medium text-ozora-cream/80 transition hover:bg-white/10 hover:text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise'
          : navLinkClass
      }
    >
      {shellText(language, 'navBookings')}
    </a>
  );
}

function CartLink({ menu, onClick }: { menu?: boolean; onClick?: () => void }) {
  const { language } = useLanguage();
  const { count } = useShopCart();
  if (menu) {
    return (
      <a
        href="/shop/cart"
        onClick={onClick}
        className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-base font-medium text-ozora-cream/80 transition hover:bg-white/10 hover:text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
      >
        <span>{shopText(language, 'cart')}</span>
        {count > 0 ? <span className="rounded-full bg-ozora-yellow px-2 py-0.5 text-xs font-bold text-ozora-ink">{count}</span> : null}
      </a>
    );
  }
  return (
    <a
      href="/shop/cart"
      aria-label={shopText(language, 'cartAria')}
      className="relative hidden h-9 w-9 items-center justify-center rounded-full border border-white/15 text-ozora-cream transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise lg:inline-flex"
    >
      <ShoppingBag size={18} aria-hidden="true" />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ozora-yellow px-1 text-[11px] font-bold text-ozora-ink">{count}</span>
      ) : null}
    </a>
  );
}

export function ShellHeader({ signedIn, admin = false }: { signedIn: boolean; admin?: boolean }) {
  const { language } = useLanguage();
  const accountHref = signedIn ? '/account' : '/account/sign-in';
  const accountLabel = signedIn ? accountText(language, 'accountTitle') : accountText(language, 'signIn');
  const AccountIcon = signedIn ? UserRound : LogIn;
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
          className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow lg:hidden"
          aria-label={shellText(language, 'homeAria')}
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
          className="relative z-20 inline-flex items-center justify-center rounded-lg p-2 text-ozora-cream transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise lg:hidden"
          aria-label={menuOpen ? shellText(language, 'closeMenu') : shellText(language, 'openMenu')}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
        >
          {menuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>

        <a
          href="/"
          className="relative z-20 hidden shrink-0 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow lg:flex"
          aria-label={shellText(language, 'homeAria')}
        >
          <img
            src="/branding/tropical-nomads-logo-horizontal-cream.png"
            alt="Tropical Nomads"
            className="h-9 w-auto object-contain"
          />
        </a>

        <nav
          aria-label={shellText(language, 'primary')}
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex"
        >
          <a href="/" className={navLinkClass}>
            {shellText(language, 'navHome')}
          </a>
          {navigation.map((item) => (
            <a key={item.id} href={item.href} className={navLinkClass}>
              {headerLabel(language, item.id)}
            </a>
          ))}
          <BookingsLink />
          {admin ? (
            <a href="/admin/events" className={navLinkClass}>
              {shellText(language, 'eventsAdmin')}
            </a>
          ) : null}
        </nav>

        <div className="relative z-20 flex items-center gap-2">
          <CartLink />
          <a
            href={accountHref}
            className="group inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-ozora-yellow/80 bg-ozora-yellow px-2.5 text-sm font-bold text-ozora-ink shadow-[0_8px_22px_rgba(250,208,46,0.2)] transition hover:-translate-y-0.5 hover:border-ozora-coral hover:bg-ozora-coral hover:shadow-[0_12px_26px_rgba(255,127,80,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-ozora-navy sm:px-4"
          >
            <AccountIcon size={16} aria-hidden="true" className="transition-transform group-hover:scale-110" />
            {accountLabel}
          </a>
        </div>
      </div>

      {menuOpen ? (
        <nav
          id="mobile-nav"
          aria-label={shellText(language, 'primaryMobile')}
          className="flex flex-col gap-1 border-t border-white/10 bg-ozora-navy/95 px-5 py-3 lg:hidden"
        >
          <a
            href="/"
            onClick={closeMenu}
            className="rounded-lg px-3 py-2.5 text-left text-base font-medium text-ozora-cream/80 transition hover:bg-white/10 hover:text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
          >
            {shellText(language, 'navHome')}
          </a>
          {navigation.map((item) => (
            <a
              key={item.id}
              href={item.href}
              onClick={closeMenu}
              className="rounded-lg px-3 py-2.5 text-left text-base font-medium text-ozora-cream/80 transition hover:bg-white/10 hover:text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
            >
              {headerLabel(language, item.id)}
            </a>
          ))}
          <BookingsLink menu onClick={closeMenu} />
          {admin ? (
            <a
              href="/admin/events"
              onClick={closeMenu}
              className="rounded-lg px-3 py-2.5 text-left text-base font-medium text-ozora-cream/80 transition hover:bg-white/10 hover:text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
            >
              {shellText(language, 'eventsAdmin')}
            </a>
          ) : null}
          <CartLink menu onClick={closeMenu} />
          <div className="mt-2 border-t border-white/10 px-3 pt-3">
            <LanguageSwitch />
          </div>
        </nav>
      ) : null}
    </header>
  );
}
