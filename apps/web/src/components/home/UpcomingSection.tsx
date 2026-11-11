'use client';

import { Calendar, CalendarClock, Clock, ExternalLink, MapPin, Ticket } from 'lucide-react';
import { formatEventDate } from 'tropical-nomads-shared';
import { placeLine, upcomingSummary } from '../../home/summary';
import type { HomeEvent, HomePartner } from '../../home/types';
import { eventText, homeText } from '../../i18n/copy';
import { fillHome } from '../../i18n/home';
import { useLanguage } from '../../i18n/provider';
import { EmptyState } from '../../../../one-pager/src/components/EmptyState';
import { PartnerAvatar } from './PartnerAvatar';
import { Button } from '../ui/Button';

export function UpcomingSection({ events, partners }: { events: readonly HomeEvent[]; partners: readonly HomePartner[] }) {
  const { language } = useLanguage();
  const partnerById = new Map(partners.map((partner) => [partner.id, partner]));

  return (
    <section id="upcoming-events" className="px-5 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl font-bold text-ozora-cream md:text-3xl">{homeText(language, 'upcomingTitle')}</h2>
        <p className="mt-2 text-sm text-ozora-cream/75">{homeText(language, 'upcomingSubtitle')}</p>
        {events.length === 0 ? (
          <div className="mt-6">
            <EmptyState title={homeText(language, 'noUpcomingTitle')} description={homeText(language, 'noUpcomingBody')} />
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {events.map((event, index) => {
              const highlighted = index < 2;
              const summary = upcomingSummary(event);
              const place = placeLine(event);
              const eventPartners = event.partnerIds.flatMap((partnerId) => {
                const partner = partnerById.get(partnerId);
                return partner === undefined ? [] : [partner];
              });
              return (
                <article
                  key={event.id}
                  className={`flex flex-col gap-4 rounded-2xl border p-4 transition md:min-h-[15rem] md:flex-row md:items-stretch ${
                    highlighted ? 'border-ozora-yellow/60 bg-ozora-yellow/10 shadow-glow' : 'border-white/10 bg-black/20'
                  }`}
                >
                  {event.bannerSrc ? (
                    <img
                      src={event.bannerSrc}
                      alt={fillHome(eventText(language, 'flyerAlt'), { title: event.title })}
                      loading="lazy"
                      className="mx-auto aspect-[3/4] w-full max-w-[260px] rounded-xl object-cover md:mx-0 md:aspect-auto md:h-auto md:w-44 md:max-w-none"
                    />
                  ) : (
                    <div className="mx-auto flex aspect-[3/4] w-full max-w-[260px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-black/30 text-center md:mx-0 md:aspect-auto md:h-auto md:w-44 md:max-w-none">
                      <Clock size={24} aria-hidden="true" className="text-ozora-cream/40" />
                      <span className="px-2 text-sm font-semibold uppercase tracking-wide text-ozora-cream/55">
                        {homeText(language, 'comingSoon')}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-1 flex-col">
                    {highlighted ? (
                      <span className="mb-1 inline-flex w-fit items-center rounded-full bg-ozora-yellow/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-ozora-yellow">
                        {homeText(language, 'nextUp')}
                      </span>
                    ) : null}
                    <h3 className="text-lg font-semibold text-ozora-cream">{event.title}</h3>
                    <p className="mt-1 flex items-center gap-2 text-sm text-ozora-cream/75">
                      <Calendar size={16} aria-hidden="true" />
                      {formatEventDate(event, homeText(language, 'dateLocale'))}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-ozora-cream/75">
                      <MapPin size={16} aria-hidden="true" />
                      {event.mapUrl ? (
                        <a
                          href={event.mapUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="font-medium text-ozora-turquoise underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
                          aria-label={fillHome(homeText(language, 'mapsAria'), { place: event.venueName ?? event.city })}
                        >
                          {place}
                        </a>
                      ) : (
                        <span>{place}</span>
                      )}
                    </p>
                    {summary ? <p className="mt-2 text-sm text-ozora-cream/70">{summary}</p> : null}
                    <div className="mt-4 flex flex-col items-center gap-3 md:items-start">
                      {event.ticketUrl ? (
                        event.ticketsOnSale ? (
                          <Button
                            href={event.ticketUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            size="sm"
                            aria-label={fillHome(homeText(language, 'buyTicketsAria'), { title: event.title })}
                            icon={<Ticket size={16} aria-hidden="true" />}
                          >
                            {homeText(language, 'buyTickets')}
                          </Button>
                        ) : (
                          <a
                            href={event.ticketUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-2 rounded-xl border border-ozora-turquoise/70 bg-ozora-turquoise/10 px-4 py-2 text-sm font-semibold text-ozora-cream transition hover:bg-ozora-turquoise/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
                            aria-label={fillHome(homeText(language, 'goabaseAria'), { title: event.title })}
                          >
                            {homeText(language, 'eventDetails')}
                            <ExternalLink size={16} aria-hidden="true" />
                          </a>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-ozora-cream/60">
                          <Clock size={16} aria-hidden="true" />
                          {homeText(language, 'comingSoon')}
                        </span>
                      )}
                      {event.timetableUrl ? (
                        <a
                          href={event.timetableUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-2 rounded-lg border border-ozora-turquoise/70 bg-ozora-turquoise/10 px-4 py-2 text-sm font-semibold text-ozora-cream transition hover:bg-ozora-turquoise/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
                          aria-label={fillHome(homeText(language, 'timetableAria'), { title: event.title })}
                        >
                          <CalendarClock size={16} aria-hidden="true" />
                          {homeText(language, 'timetable')}
                        </a>
                      ) : null}
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
                          aria-label={fillHome(homeText(language, 'partnerAria'), { name: partner.name })}
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
