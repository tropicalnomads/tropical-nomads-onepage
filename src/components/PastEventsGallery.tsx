import type { JSX } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import type { EventRecord } from '@/lib/data';
import { EmptyState } from '@/components/EmptyState';
import { useI18n } from '@/i18n/I18nProvider';

interface PastEventsGalleryProps {
  events: EventRecord[];
  onOpenPreview: (event: EventRecord) => void;
}

function formatEventDate(dateStart: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(dateStart));
}

const cardClassName =
  'group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/20 text-left transition hover:border-ozora-turquoise/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise';

function CardContent({ event, locale }: { event: EventRecord; locale: string }): JSX.Element {
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
      </div>
    </>
  );
}

export function PastEventsGallery({ events, onOpenPreview }: PastEventsGalleryProps): JSX.Element {
  const { t } = useI18n();
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
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) =>
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
        )}
      </div>
    </section>
  );
}
