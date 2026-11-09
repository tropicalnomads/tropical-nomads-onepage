'use client';

import { useId, useMemo, useState } from 'react';
import { Calendar, MapPin, Music, Search, X } from 'lucide-react';
import { formatEventDate } from 'tropical-nomads-shared';
import { pastSummary, placeLine } from '../../home/summary';
import type { HomeEvent } from '../../home/types';
import { eventText, homeText } from '../../i18n/copy';
import { fillHome, homePastCount, homeShowMore } from '../../i18n/home';
import { useLanguage } from '../../i18n/provider';
import { EmptyState } from '../../../../one-pager/src/components/EmptyState';

const initialVisible = 3;
const pageSize = 6;

const cardClassName =
  'group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/20 text-left transition hover:border-ozora-turquoise/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise';

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function eventSearchHaystack(event: HomeEvent): string {
  const artists = [...event.cardArtists, ...event.stages.flatMap((stage) => stage.artists.map((artist) => artist.name))];
  return normalizeSearch([event.title, event.venueName ?? '', event.city, event.country, ...artists].join(' '));
}

function matchesQuery(event: HomeEvent, query: string): boolean {
  const tokens = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return true;
  }
  const haystack = eventSearchHaystack(event);
  return tokens.every((token) => haystack.includes(token));
}

function CardContent({ event }: { event: HomeEvent }) {
  const { language } = useLanguage();
  const summary = pastSummary(event);
  return (
    <>
      <div className="aspect-[3/4] w-full overflow-hidden">
        {event.bannerSrc ? (
          <img
            src={event.bannerSrc}
            alt={fillHome(eventText(language, 'flyerAlt'), { title: event.title })}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-ozora-navy/60" aria-hidden="true" />
        )}
      </div>
      <div className="space-y-1 p-4">
        <h3 className="text-base font-semibold text-ozora-cream group-hover:text-ozora-yellow">{event.title}</h3>
        <p className="flex items-center gap-2 text-sm text-ozora-cream/70">
          <Calendar size={14} aria-hidden="true" />
          {formatEventDate(event, homeText(language, 'dateLocale'), 'medium')}
        </p>
        <p className="flex items-center gap-2 text-sm text-ozora-cream/70">
          <MapPin size={14} aria-hidden="true" />
          <span>{placeLine(event)}</span>
        </p>
        {summary ? (
          <p className="flex items-start gap-2 text-sm text-ozora-cream/70">
            <Music size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>{summary}</span>
          </p>
        ) : null}
      </div>
    </>
  );
}

export function PastSection({ events, onOpenPreview }: { events: readonly HomeEvent[]; onOpenPreview: (event: HomeEvent) => void }) {
  const { language } = useLanguage();
  const searchId = useId();
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(initialVisible);
  const filteredEvents = useMemo(() => events.filter((event) => matchesQuery(event, query)), [events, query]);
  const shownEvents = filteredEvents.slice(0, visibleCount);
  const remainingCount = Math.max(0, filteredEvents.length - shownEvents.length);
  const nextPageCount = Math.min(pageSize, remainingCount);
  const isExpanded = visibleCount > initialVisible;
  const hasQuery = query.trim().length > 0;

  const handleQueryChange = (value: string): void => {
    setQuery(value);
    setVisibleCount(initialVisible);
  };

  const handleShowLess = (): void => {
    setVisibleCount(initialVisible);
    document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id="gallery" className="px-5 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl font-bold text-ozora-cream md:text-3xl">{homeText(language, 'pastTitle')}</h2>
        <p className="mt-2 text-sm text-ozora-cream/75">{homeText(language, 'pastSubtitle')}</p>
        {events.length === 0 ? (
          <div className="mt-6">
            <EmptyState title={homeText(language, 'noPastTitle')} description={homeText(language, 'noPastBody')} />
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <label className="sr-only" htmlFor={searchId}>
                {homeText(language, 'searchLabel')}
              </label>
              <div className="relative w-full md:max-w-md">
                <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ozora-cream/50" />
                <input
                  id={searchId}
                  type="text"
                  value={query}
                  onChange={(event) => handleQueryChange(event.target.value)}
                  placeholder={homeText(language, 'searchPlaceholder')}
                  autoComplete="off"
                  inputMode="search"
                  enterKeyHint="search"
                  role="searchbox"
                  className="h-12 w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-10 pr-12 text-base text-ozora-cream placeholder:text-ozora-cream/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise md:h-11 md:text-sm"
                />
                {hasQuery ? (
                  <button
                    type="button"
                    onClick={() => handleQueryChange('')}
                    className="absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ozora-cream/70 transition hover:bg-white/10 hover:text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
                    aria-label={homeText(language, 'clearSearch')}
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                ) : null}
              </div>
              <p className="text-sm text-ozora-cream/65 md:text-right" aria-live="polite">
                {homePastCount(language, shownEvents.length, filteredEvents.length)}
              </p>
            </div>
            {filteredEvents.length === 0 ? (
              <div className="mt-6">
                <EmptyState title={homeText(language, 'noPastSearchTitle')} description={homeText(language, 'noPastSearchBody')} />
              </div>
            ) : (
              <>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {shownEvents.map((event) =>
                    event.instagramPost ? (
                      <a
                        key={event.id}
                        href={event.instagramPost}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={cardClassName}
                        aria-label={fillHome(homeText(language, 'openEventInstagramAria'), { title: event.title })}
                      >
                        <CardContent event={event} />
                      </a>
                    ) : (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => onOpenPreview(event)}
                        className={cardClassName}
                        aria-label={fillHome(homeText(language, 'viewDetailsAria'), { title: event.title })}
                      >
                        <CardContent event={event} />
                      </button>
                    ),
                  )}
                </div>
                {remainingCount > 0 || isExpanded ? (
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    {remainingCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => setVisibleCount((count) => count + nextPageCount)}
                        className="inline-flex min-h-12 items-center justify-center rounded-full border border-ozora-turquoise/70 bg-ozora-turquoise/10 px-5 py-2.5 text-sm font-semibold text-ozora-cream transition hover:bg-ozora-turquoise/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
                      >
                        {homeShowMore(language, nextPageCount)}
                      </button>
                    ) : null}
                    {isExpanded ? (
                      <button
                        type="button"
                        onClick={handleShowLess}
                        className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-ozora-cream/80 transition hover:bg-white/10 hover:text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
                      >
                        {homeText(language, 'showLess')}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
