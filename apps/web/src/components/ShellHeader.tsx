'use client';

import { ChevronDown, LogIn, LogOut, Menu, ShoppingBag, Ticket, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { origins, type Locale, type WebAreaId } from 'tropical-nomads-shared';
import { signOutAction } from '../account/actions';
import { signInHref } from '../account/return-path';
import { useCurrentPath } from '../account/use-return-path';
import { accountText, areaText, shellText } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';
import { shopText } from '../i18n/shop-copy';
import { navigation } from '../navigation';
import { publicHref } from '../seo/urls';
import { useShopCart } from '../shop/useShopCart';
import { LanguageSwitch } from './LanguageSwitch';
import { Button, IconButton } from './ui/Button';
import { Menu as AccountMenu, MenuItem, MenuSeparator } from './ui/Menu';

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
    <Button href="/shop/cart" tone="ghost" size="sm" aria-label={shopText(language, 'cartAria')} className="relative hidden h-9 w-9 px-0 lg:inline-flex">
      <ShoppingBag size={18} aria-hidden="true" />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ozora-yellow px-1 text-[11px] font-bold text-ozora-ink">{count}</span>
      ) : null}
    </Button>
  );
}

function AccountControl({ signedIn, onOpen }: { signedIn: boolean; onOpen?: () => void }) {
  const { language } = useLanguage();
  const here = useCurrentPath();
  const accountHref = signedIn ? '/account' : signInHref(here);
  const accountLabel = signedIn ? accountText(language, 'accountTitle') : accountText(language, 'signIn');
  const [signingOut, setSigningOut] = useState(false);

  if (!signedIn) {
    return (
      <Button href={accountHref} size="sm" className="h-9 px-2.5 sm:px-4" icon={<LogIn size={16} aria-hidden="true" />}>
        {accountLabel}
      </Button>
    );
  }

  const signOut = async (): Promise<void> => {
    if (signingOut) {
      return;
    }
    setSigningOut(true);
    try {
      await signOutAction();
      window.location.assign('/');
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <AccountMenu
      label={accountLabel}
      onOpen={onOpen}
      trigger={({ open, toggle, menuId }) => (
        <Button
          type="button"
          size="sm"
          className="h-9 px-2.5 sm:px-4"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-controls={menuId}
          onClick={toggle}
        >
          <UserRound size={16} aria-hidden="true" />
          {accountLabel}
          <ChevronDown size={14} aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      )}
    >
      <MenuItem href={accountHref} icon={<UserRound size={16} aria-hidden="true" />}>
        {accountText(language, 'accountTitle')}
      </MenuItem>
      <MenuItem href="/my-tickets" icon={<Ticket size={16} aria-hidden="true" />}>
        {areaText(language, 'my-tickets')}
      </MenuItem>
      <MenuSeparator />
      <MenuItem disabled={signingOut} onSelect={() => void signOut()} icon={<LogOut size={16} aria-hidden="true" />}>
        {accountText(language, 'signOut')}
      </MenuItem>
    </AccountMenu>
  );
}

export function ShellHeader({ signedIn, admin = false }: { signedIn: boolean; admin?: boolean }) {
  const { language } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = (): void => {
    setMenuOpen(false);
  };

  return (
    <header className="safe-top sticky top-0 z-40 border-b border-white/10 bg-ozora-navy/70 backdrop-blur-md">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 md:px-8">
        <a
          href={publicHref('/', language)}
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

        <IconButton
          label={menuOpen ? shellText(language, 'closeMenu') : shellText(language, 'openMenu')}
          onClick={() => setMenuOpen((open) => !open)}
          className="relative z-20 h-10 w-10 lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
        >
          {menuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </IconButton>

        <a
          href={publicHref('/', language)}
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
          <a href={publicHref('/', language)} className={navLinkClass}>
            {shellText(language, 'navHome')}
          </a>
          {navigation.map((item) => (
            <a key={item.id} href={publicHref(item.href, language)} className={navLinkClass}>
              {headerLabel(language, item.id)}
            </a>
          ))}
          <BookingsLink />
          {admin ? (
            <a href="/admin/events" className={navLinkClass}>
              {shellText(language, 'navAdmin')}
            </a>
          ) : null}
        </nav>

        <div className="relative z-20 flex items-center gap-2">
          <CartLink />
          <AccountControl signedIn={signedIn} onOpen={closeMenu} />
        </div>
      </div>

      {menuOpen ? (
        <nav
          id="mobile-nav"
          aria-label={shellText(language, 'primaryMobile')}
          className="flex flex-col gap-1 border-t border-white/10 bg-ozora-navy/95 px-5 py-3 lg:hidden"
        >
          <a
            href={publicHref('/', language)}
            onClick={closeMenu}
            className="rounded-lg px-3 py-2.5 text-left text-base font-medium text-ozora-cream/80 transition hover:bg-white/10 hover:text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
          >
            {shellText(language, 'navHome')}
          </a>
          {navigation.map((item) => (
            <a
              key={item.id}
              href={publicHref(item.href, language)}
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
              {shellText(language, 'navAdmin')}
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
