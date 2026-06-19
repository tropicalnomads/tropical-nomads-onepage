import { CalendarDays, MapPin } from 'lucide-react';
import type { EventItem } from '@/lib/data';
import { EmptyState } from '@/components/EmptyState';

interface FeaturedEventsProps {
  events: EventItem[];
}

function formatEventDate(date: string): string {
  return new Intl.DateTimeFormat('en', { dateStyle: 'full' }).format(new Date(`${date}T00:00:00`));
}

export function FeaturedEvents({ events }: FeaturedEventsProps): JSX.Element {
  return (
    <section className="safe-x px-4 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl font-bold text-ozora-cream md:text-3xl">Featured next events</h2>
        <p className="mt-2 text-sm text-ozora-cream/75">The next two moments on our journey.</p>

        {events.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="No featured events yet" description="New dates will appear here soon." />
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {events.map((event) => (
              <article
                key={event.id}
                className="rounded-2xl border border-ozora-yellow/30 bg-ozora-yellow/10 p-5 shadow-glow"
              >
                <h3 className="text-xl font-semibold text-ozora-cream">{event.title}</h3>
                <p className="mt-3 flex items-center gap-2 text-sm text-ozora-cream/80">
                  <CalendarDays size={16} aria-hidden="true" />
                  {formatEventDate(event.date)}
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-ozora-cream/80">
                  <MapPin size={16} aria-hidden="true" />
                  {event.city}, {event.country}
                </p>
                <a
                  href={event.eventbriteUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-5 inline-flex rounded-lg bg-ozora-coral px-4 py-2 text-sm font-medium text-ozora-ink transition hover:bg-ozora-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow"
                  aria-label={`Open Eventbrite for ${event.title}`}
                >
                  Open Eventbrite
                </a>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
