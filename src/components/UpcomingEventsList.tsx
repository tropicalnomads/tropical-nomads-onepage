import { Calendar, ExternalLink, MapPin, Ticket } from 'lucide-react';
import {
  getPrimaryTicketUrl,
  getStageSummary,
  hasTicketSales,
  type EventRecord,
  type Partner,
} from '@/lib/data';
import { EmptyState } from '@/components/EmptyState';
import { PartnerAvatar } from '@/components/PartnerAvatar';

interface UpcomingEventsListProps {
  events: EventRecord[];
  partners: Partner[];
}

function formatEventDate(dateStart: string): string {
  return new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(new Date(dateStart));
}

export function UpcomingEventsList({ events, partners }: UpcomingEventsListProps): JSX.Element {
  const partnerById = new Map(partners.map((partner) => [partner.id, partner]));
  return (
    <section id="upcoming-events" className="px-5 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl font-bold text-ozora-cream md:text-3xl">Upcoming events</h2>
        <p className="mt-2 text-sm text-ozora-cream/75">All future dates, sorted from the next one.</p>

        {events.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="No upcoming events" description="Check back soon for newly announced dates." />
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {events.map((event, index) => {
              const highlighted = index < 2;
              const summary = getStageSummary(event);
              const ticketUrl = getPrimaryTicketUrl(event);
              const ticketsAvailable = hasTicketSales(event);
              const eventPartners = (event.partnerIds ?? [])
                .map((partnerId) => partnerById.get(partnerId))
                .filter((partner): partner is Partner => Boolean(partner));
              return (
                <article
                  key={event.id}
                  className={`flex flex-col gap-4 rounded-2xl border p-4 transition md:flex-row md:items-stretch ${
                    highlighted
                      ? 'border-ozora-yellow/60 bg-ozora-yellow/10 shadow-glow'
                      : 'border-white/10 bg-black/20'
                  }`}
                >
                  {event.images.bannerLocal ? (
                    <img
                      src={event.images.bannerLocal}
                      alt={`${event.title} flyer`}
                      loading="lazy"
                      className="mx-auto aspect-[3/4] w-full max-w-[260px] rounded-xl object-cover md:mx-0 md:aspect-auto md:h-auto md:w-44 md:max-w-none"
                    />
                  ) : null}

                  <div className="flex flex-1 flex-col">
                    {highlighted ? (
                      <span className="mb-1 inline-flex w-fit items-center rounded-full bg-ozora-yellow/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-ozora-yellow">
                        Next up
                      </span>
                    ) : null}
                    <h3 className="text-lg font-semibold text-ozora-cream">{event.title}</h3>
                    <p className="mt-1 flex items-center gap-2 text-sm text-ozora-cream/75">
                      <Calendar size={16} aria-hidden="true" />
                      {formatEventDate(event.dateStart)}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-ozora-cream/75">
                      <MapPin size={16} aria-hidden="true" />
                      {event.venue.mapUrl ? (
                        <a
                          href={event.venue.mapUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="font-medium text-ozora-turquoise underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
                          aria-label={`Open ${event.venue.name ?? event.venue.city} on Google Maps`}
                        >
                          {event.venue.name ? `${event.venue.name} - ` : ''}
                          {event.venue.city}, {event.venue.country}
                        </a>
                      ) : (
                        <span>
                          {event.venue.name ? `${event.venue.name} - ` : ''}
                          {event.venue.city}, {event.venue.country}
                        </span>
                      )}
                    </p>
                    {summary ? <p className="mt-2 text-sm text-ozora-cream/70">{summary}</p> : null}

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                      <a
                        href={ticketUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 ${
                          ticketsAvailable
                            ? 'bg-ozora-coral text-ozora-ink hover:bg-ozora-yellow focus-visible:ring-ozora-yellow'
                            : 'border border-ozora-turquoise/70 bg-ozora-turquoise/10 text-ozora-cream hover:bg-ozora-turquoise/20 focus-visible:ring-ozora-turquoise'
                        }`}
                        aria-label={
                          ticketsAvailable
                            ? `Buy tickets for ${event.title}`
                            : `View ${event.title} on goabase`
                        }
                      >
                        {ticketsAvailable ? (
                          <>
                            <Ticket size={16} aria-hidden="true" />
                            Buy tickets
                          </>
                        ) : (
                          <>
                            Event details
                            <ExternalLink size={16} aria-hidden="true" />
                          </>
                        )}
                      </a>
                    </div>
                  </div>

                  {eventPartners.length > 0 ? (
                    <div className="hidden shrink-0 flex-row items-center justify-center gap-3 md:flex md:self-center">
                      {eventPartners.map((partner) => (
                        <a
                          key={partner.id}
                          href={partner.instagram}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="group focus-visible:outline-none"
                          aria-label={`Open ${partner.name} on Instagram`}
                          title={partner.name}
                        >
                          <PartnerAvatar
                            partner={partner}
                            className="h-20 w-20 group-focus-visible:ring-2 group-focus-visible:ring-ozora-pink md:h-24 md:w-24"
                            textClassName="text-2xl"
                          />
                        </a>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
