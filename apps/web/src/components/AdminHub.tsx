'use client';

import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ManagedParty } from 'tropical-nomads-api/parties';
import type { ShopOrderRow } from '../admin/shop-values';
import { adminText } from '../i18n/copy';
import { shopText } from '../i18n/shop-copy';
import { useLanguage } from '../i18n/provider';
import type { ShopCatalogProduct } from '../shop/catalog';
import { AdminFrame, type AdminTab } from './AdminFrame';
import { AdminEventList } from './AdminEventList';
import { AdminShopOrders } from './AdminShopOrders';
import { Button } from './ui/Button';

const tabPath = {
  events: '/admin/events',
  shop: '/admin/shops',
} as const satisfies Record<AdminTab, string>;

function tabFromPath(pathname: string): AdminTab {
  return pathname === tabPath.shop ? 'shop' : 'events';
}

function addLabel(language: Parameters<typeof adminText>[0], tab: AdminTab): string {
  switch (tab) {
    case 'events':
      return adminText(language, 'newEvent');
    case 'shop':
      return shopText(language, 'addProduct');
    default: {
      const unexpected: never = tab;
      return unexpected;
    }
  }
}

function addHref(tab: AdminTab): string {
  switch (tab) {
    case 'events':
      return '/admin/events/new';
    case 'shop':
      return '/admin/shop/new';
    default: {
      const unexpected: never = tab;
      return unexpected;
    }
  }
}

export function AdminHub({
  initialTab,
  parties,
  orders,
  products,
}: {
  initialTab: AdminTab;
  parties: readonly ManagedParty[];
  orders: readonly ShopOrderRow[];
  products: readonly ShopCatalogProduct[];
}) {
  const { language } = useLanguage();
  const [tab, setTab] = useState<AdminTab>(initialTab);

  useEffect(() => {
    function onPop(): void {
      setTab(tabFromPath(window.location.pathname));
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  function select(next: AdminTab): void {
    setTab(next);
    const url = tabPath[next];
    if (window.location.pathname !== url) {
      window.history.pushState({ adminTab: next }, '', url);
    }
  }

  return (
    <AdminFrame
      tab={tab}
      onTab={select}
      action={
        <Button href={addHref(tab)} icon={<Plus size={18} aria-hidden="true" />}>
          {addLabel(language, tab)}
        </Button>
      }
    >
      <div hidden={tab !== 'events'}>
        <AdminEventList parties={parties} />
      </div>
      <div hidden={tab !== 'shop'}>
        <AdminShopOrders orders={orders} products={products} />
      </div>
    </AdminFrame>
  );
}
