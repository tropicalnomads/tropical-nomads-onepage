'use client';

import type { ReactNode } from 'react';
import type { Locale } from 'tropical-nomads-shared';
import { adminText, areaText, shellText } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';
import { Button } from './ui/Button';

export type AdminTab = 'events' | 'shop' | 'orders';

const tabs = [
  { id: 'events' },
  { id: 'shop' },
  { id: 'orders' },
] as const satisfies readonly { id: AdminTab }[];

function tabLabel(language: Locale, id: AdminTab): string {
  switch (id) {
    case 'events':
      return shellText(language, 'eventsAdmin');
    case 'shop':
      return areaText(language, 'shop');
    case 'orders':
      return adminText(language, 'ordersTab');
    default: {
      const unexpected: never = id;
      return unexpected;
    }
  }
}

export function AdminFrame({
  tab,
  onTab,
  action,
  children,
}: {
  tab: AdminTab;
  onTab: (tab: AdminTab) => void;
  action?: ReactNode;
  children: ReactNode;
}) {
  const { language } = useLanguage();
  return (
    <main className="relative overflow-hidden px-5 py-10 md:px-8 md:py-14">
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[52rem] -translate-x-1/2 rounded-full bg-ozora-turquoise/[0.06] blur-3xl" />
      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-ozora-cream md:text-5xl">{shellText(language, 'navAdmin')}</h1>
            <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label={shellText(language, 'navAdmin')}>
              {tabs.map((item) => {
                const selected = item.id === tab;
                return (
                  <Button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    tone={selected ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => onTab(item.id)}
                  >
                    {tabLabel(language, item.id)}
                  </Button>
                );
              })}
            </div>
          </div>
          {action}
        </div>
        {children}
      </div>
    </main>
  );
}
