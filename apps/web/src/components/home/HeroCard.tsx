'use client';

import { Instagram } from 'lucide-react';
import { homeText, shellText } from '../../i18n/copy';
import { useLanguage } from '../../i18n/provider';
import { Button } from '../ui/Button';

export function HeroCard({ followHref }: { followHref: string }) {
  const { language } = useLanguage();

  return (
    <section id="home" className="px-5 py-8 md:px-8">
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-black/30 p-7 text-center shadow-2xl backdrop-blur-sm md:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-ozora-turquoise/20 blur-3xl"
        />
        <div className="relative">
          <img
            src="/branding/tropical-nomads-logo-horizontal-cream.png"
            alt="Tropical Nomads"
            className="mx-auto h-16 w-auto object-contain md:h-20"
          />
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-ozora-turquoise md:text-sm">
            {shellText(language, 'tagline')}
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ozora-cream/85 md:text-lg">
            {homeText(language, 'description')}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="#upcoming-events" className="w-full sm:w-auto" aria-label={homeText(language, 'exploreUpcomingAria')}>
              {homeText(language, 'exploreUpcoming')}
            </Button>
            <a
              href={followHref}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-ozora-pink/50 bg-ozora-pink/10 px-5 py-3 text-sm font-semibold text-ozora-cream transition hover:border-ozora-yellow hover:bg-ozora-yellow/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow sm:w-auto"
            >
              <Instagram size={16} aria-hidden="true" />
              {homeText(language, 'followJourney')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
