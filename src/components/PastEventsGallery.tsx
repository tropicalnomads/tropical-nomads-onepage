import { useId, useMemo, useState, type JSX } from 'react';
import { Calendar, MapPin, Music, Search, X } from 'lucide-react';
import { getStageSummary, type EventRecord } from '@/lib/data';
import { EmptyState } from '@/components/EmptyState';
import { useI18n } from '@/i18n/I18nProvider';

interface PastEventsGalleryProps {
  events: EventRecord[];
  onOpenPreview: (event: EventRecord) => void;
}

const INITIAL_VISIBLE = 3;
const PAGE_SIZE = 6;

const cardClassName =
  'group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/20 text-left transition hover:border-ozora-turquoise/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise';

function formatEventDate(dateStart: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(dateStart));
}

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function eventSearchHaystack(event: EventRecord): string {
  const artists = [
    ...(event.cardArtists ?? []),
    ...event.stages.flatMap((stage) => stage.artists.map((artist) => artist.name)),
  ];
  return normalizeSearch(
    [event.title, event.venue.name ?? '', event.venue.city, event.venue.country, ...artists].join(' '),
  );
}

function matchesQuery(event: EventRecord, query: string): boolean {
  const tokens = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = eventSearchHaystack(event);
  return tokens.every((token) => haystack.includes(token));
}

function CardContent({ event, locale }: { event: EventRecord; locale: string }): JSX.Element {
  const summary = getStageSummary(event, 3);
  return (
    <>
      <div className="aspect-[3/4] w-full overflow-hidden">
        {event.images.bannerLocal ? (
          <img
            src={event.images.bannerLocal}
            alt={`${event.title} flyer`}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-ozora-navy/60" aria-hidden="true" />
        )}
      </div>
      <div className="space-y-1 p-4">
        <h3 className="text-base font-semibold text-ozora-cream group-hover:text-ozora-yellow">
          {event.title}
        </h3>
        <p className="flex items-center gap-2 text-sm text-ozora-cream/70">
          <Calendar size={14} aria-hidden="true" />
          {formatEventDate(event.dateStart, locale)}
        </p>
        <p className="flex items-center gap-2 text-sm text-ozora-cream/70">
          <MapPin size={14} aria-hidden="true" />
          <span>
            {event.venue.name ? `${event.venue.name} - ` : ''}
            {event.venue.city}, {event.venue.country}
          </span>
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

export function PastEventsGallery({ events, onOpenPreview }: PastEventsGalleryProps): JSX.Element {
  const { t } = useI18n();
  const searchId = useId();
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const filteredEvents = useMemo(
    () => events.filter((event) => matchesQuery(event, query)),
    [events, query],
  );
  const shownEvents = filteredEvents.slice(0, visibleCount);
  const remainingCount = Math.max(0, filteredEvents.length - shownEvents.length);
  const nextPageCount = Math.min(PAGE_SIZE, remainingCount);
  const isExpanded = visibleCount > INITIAL_VISIBLE;
  const hasQuery = query.trim().length > 0;

  const handleQueryChange = (value: string): void => {
    setQuery(value);
    setVisibleCount(INITIAL_VISIBLE);
  };

  const handleShowLess = (): void => {
    setVisibleCount(INITIAL_VISIBLE);
    document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id="gallery" className="px-5 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl font-bold text-ozora-cream md:text-3xl">{t.pastEvents}</h2>
        <p className="mt-2 text-sm text-ozora-cream/75">{t.pastEventsSubtitle}</p>

        {events.length === 0 ? (
          <div className="mt-6">
            <EmptyState title={t.noPastTitle} description={t.noPastBody} />
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <label className="sr-only" htmlFor={searchId}>
                {t.searchPastEvents}
              </label>
              <div className="relative w-full md:max-w-md">
                <Search
                  size={18}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ozora-cream/50"
                />
                <input
                  id={searchId}
                  type="text"
                  value={query}
                  onChange={(event) => handleQueryChange(event.target.value)}
                  placeholder={t.searchPastEventsPlaceholder}
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
                    aria-label={t.clearSearch}
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                ) : null}
              </div>
              <p className="text-sm text-ozora-cream/65 md:text-right" aria-live="polite">
                {t.pastEventsResults(shownEvents.length, filteredEvents.length)}
              </p>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="mt-6">
                <EmptyState title={t.noPastSearchTitle} description={t.noPastSearchBody} />
              </div>
            ) : (
              <>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {shownEvents.map((event) =>
                    event.links.instagramPost ? (
                      <a
                        key={event.id}
                        href={event.links.instagramPost}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={cardClassName}
                        aria-label={t.openEventInstagramAria(event.title)}
                      >
                        <CardContent event={event} locale={t.dateLocale} />
                      </a>
                    ) : (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => onOpenPreview(event)}
                        className={cardClassName}
                        aria-label={t.viewDetailsAria(event.title)}
                      >
                        <CardContent event={event} locale={t.dateLocale} />
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
                        {t.showMorePastEvents(nextPageCount)}
                      </button>
                    ) : null}
                    {isExpanded ? (
                      <button
                        type="button"
                        onClick={handleShowLess}
                        className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-ozora-cream/80 transition hover:bg-white/10 hover:text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
                      >
                        {t.showLessPastEvents}
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
