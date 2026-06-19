import { Calendar, ExternalLink, MapPin } from 'lucide-react';
import type { EventItem } from '@/lib/data';
import { EmptyState } from '@/components/EmptyState';

interface UpcomingEventsListProps {
  events: EventItem[];
}

function formatEventDate(date: string): string {
  return new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(new Date(`${date}T00:00:00`));
}

export function UpcomingEventsList({ events }: UpcomingEventsListProps): JSX.Element {
  return (
    <section id="upcoming-events" className="safe-x px-4 py-14 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl font-bold text-ozora-cream md:text-3xl">Upcoming events</h2>
        <p className="mt-2 text-sm text-ozora-cream/75">All future dates, sorted from the next one.</p>

        {events.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="No upcoming events" description="Check back soon for newly announced dates." />
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {events.map((event) => (
              <article
                key={event.id}
                className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/20 p-5 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h3 className="text-lg font-semibold text-ozora-cream">{event.title}</h3>
                  <p className="mt-1 flex items-center gap-2 text-sm text-ozora-cream/75">
                    <Calendar size={16} aria-hidden="true" />
                    {formatEventDate(event.date)}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-ozora-cream/75">
                    <MapPin size={16} aria-hidden="true" />
                    {event.city}, {event.country}
                  </p>
                  <p className="mt-2 text-sm text-ozora-cream/75">{event.description}</p>
                </div>
                <a
                  href={event.eventbriteUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 self-start rounded-lg border border-ozora-turquoise/70 bg-ozora-turquoise/10 px-4 py-2 text-sm font-medium text-ozora-cream transition hover:bg-ozora-turquoise/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
                  aria-label={`Open Eventbrite page for ${event.title}`}
                >
                  Tickets
                  <ExternalLink size={16} aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
