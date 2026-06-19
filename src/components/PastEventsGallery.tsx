import { Calendar, MapPin } from 'lucide-react';
import type { EventRecord } from '@/lib/data';
import { EmptyState } from '@/components/EmptyState';

interface PastEventsGalleryProps {
  events: EventRecord[];
  onOpenPreview: (event: EventRecord) => void;
}

function formatEventDate(dateStart: string): string {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(dateStart));
}

export function PastEventsGallery({ events, onOpenPreview }: PastEventsGalleryProps): JSX.Element {
  return (
    <section id="gallery" className="safe-x px-5 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl font-bold text-ozora-cream md:text-3xl">Past events</h2>
        <p className="mt-2 text-sm text-ozora-cream/75">A look back at our previous gatherings.</p>

        {events.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="No past events yet" description="Our history will appear here." />
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => onOpenPreview(event)}
                className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/20 text-left transition hover:border-ozora-turquoise/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
                aria-label={`View details for ${event.title}`}
              >
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
                    {formatEventDate(event.dateStart)}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-ozora-cream/70">
                    <MapPin size={14} aria-hidden="true" />
                    <span>
                      {event.venue.name ? `${event.venue.name} - ` : ''}
                      {event.venue.city}, {event.venue.country}
                    </span>
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
