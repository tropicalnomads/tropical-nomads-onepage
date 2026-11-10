'use client';

import type { ReactNode } from 'react';
import type { ManagedParty } from 'tropical-nomads-api/parties';
import { adminText } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';

export function AdminDenied() {
  const { language } = useLanguage();
  return (
    <main className="px-5 py-8 md:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-ozora-cream">{adminText(language, 'deniedTitle')}</h1>
        <p className="mt-2 text-sm text-ozora-cream/75">{adminText(language, 'deniedBody')}</p>
      </div>
    </main>
  );
}

export function AdminEventList({ parties }: { parties: readonly ManagedParty[] }) {
  const { language } = useLanguage();
  return (
    <main className="px-5 py-8 md:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-ozora-cream md:text-3xl">{adminText(language, 'title')}</h1>
          <a href="/admin/events/new" className="rounded-lg bg-ozora-coral px-4 py-2 text-sm font-semibold text-ozora-ink">
            {adminText(language, 'newEvent')}
          </a>
        </div>
        {parties.length === 0 ? <p className="mt-6 text-sm text-ozora-cream/75">{adminText(language, 'empty')}</p> : null}
        <ul className="mt-6 space-y-2">
          {parties.map((party) => (
            <li key={party.id}>
              <a href={`/admin/events/${party.id}`} className="block rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                <span className="block font-semibold text-ozora-cream">{party.event.title}</span>
                <span className="mt-1 block text-sm text-ozora-cream/70">{adminText(language, party.publication === 'draft' ? 'draft' : 'published')}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

export function AdminEventEditor({ heading, publication, children }: { heading: 'newEvent' | 'editEvent'; publication?: 'draft' | 'published'; children: ReactNode }) {
  const { language } = useLanguage();
  return (
    <main className="px-5 py-8 md:px-8">
      <div className="mx-auto max-w-3xl">
        <a href="/admin/events" className="text-sm font-semibold text-ozora-turquoise">
          {adminText(language, 'back')}
        </a>
        <h1 className="mt-3 text-2xl font-bold text-ozora-cream md:text-3xl">{adminText(language, heading)}</h1>
        {publication ? <p className="mt-2 text-sm text-ozora-yellow">{adminText(language, publication === 'draft' ? 'draft' : 'published')}</p> : null}
        {children}
      </div>
    </main>
  );
}
