'use client';

import { Calendar, CalendarClock, Clock, ExternalLink, MapPin, Ticket } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { formatEventDate, getStageSummary } from 'tropical-nomads-shared';
import type { UpcomingEventCard } from '../events/types';
import { accountText, areaText, eventText, paymentNotice, paymentText } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';
import { issueTicketAction, type TicketActionResult } from '../tickets/actions';
import { EmptyState } from '../../../one-pager/src/components/EmptyState';
import { SelectField } from './SelectField';

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, value), template);
}

function venueLabel(event: UpcomingEventCard): string {
  const place = [event.venueName, [event.city, event.country].filter(Boolean).join(', ')].filter(Boolean);
  return place.join(' - ');
}

export function UpcomingEvents({ events }: { events: readonly UpcomingEventCard[] }) {
  const { language } = useLanguage();
  const label = areaText(language, 'upcoming-events');

  return (
    <section className="px-5 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-ozora-cream md:text-3xl">{label}</h1>
        <p className="mt-2 text-sm text-ozora-cream/75">{eventText(language, 'subtitle')}</p>
        {events.length === 0 ? (
          <div className="mt-6">
            <EmptyState title={eventText(language, 'emptyTitle')} description={eventText(language, 'emptyBody')} />
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {events.map((event, index) => {
              const highlighted = index < 2;
              const lineupCount = event.stages.reduce((count, stage) => count + stage.artists.length, 0);
              const summary = getStageSummary(
                {
                  cardArtists: event.cardArtists,
                  stages: event.stages.map((stage) => ({ artists: stage.artists.map((name) => ({ name })) })),
                },
                event.cardArtists.length >= lineupCount && lineupCount > 0 ? lineupCount : 4,
              );
              const place = venueLabel(event);
              const date = formatEventDate(event, eventText(language, 'dateLocale'));
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
                      alt={fill(eventText(language, 'flyerAlt'), { title: event.title })}
                      className="mx-auto aspect-[3/4] w-full max-w-[260px] rounded-xl object-cover md:mx-0 md:aspect-auto md:h-auto md:w-44 md:max-w-none"
                    />
                  ) : (
                    <div className="mx-auto flex aspect-[3/4] w-full max-w-[260px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-black/30 text-center md:mx-0 md:aspect-auto md:h-auto md:w-44 md:max-w-none">
                      <Clock size={24} aria-hidden="true" className="text-ozora-cream/40" />
                      <span className="px-2 text-sm font-semibold uppercase tracking-wide text-ozora-cream/55">
                        {eventText(language, 'comingSoon')}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-1 flex-col">
                    {highlighted ? (
                      <span className="mb-1 inline-flex w-fit items-center rounded-full bg-ozora-yellow/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-ozora-yellow">
                        {eventText(language, 'nextUp')}
                      </span>
                    ) : null}
                    <h2 className="text-lg font-semibold text-ozora-cream">{event.title}</h2>
                    <p className="mt-1 flex items-center gap-2 text-sm text-ozora-cream/75">
                      <Calendar size={16} aria-hidden="true" />
                      {date}
                    </p>
                    {place ? (
                      <p className="mt-1 flex items-center gap-2 text-sm text-ozora-cream/75">
                        <MapPin size={16} aria-hidden="true" />
                        {event.mapUrl ? (
                          <a
                            href={event.mapUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="font-medium text-ozora-turquoise underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
                            aria-label={fill(eventText(language, 'mapsAria'), { place })}
                          >
                            {place}
                          </a>
                        ) : (
                          <span>{place}</span>
                        )}
                      </p>
                    ) : null}
                    {summary ? <p className="mt-2 text-sm text-ozora-cream/70">{summary}</p> : null}
                    <div className="mt-4 flex flex-col items-center gap-3 md:items-start">
                      {event.inAppOffers.length > 0 ? (
                        <TicketPurchase event={event} />
                      ) : event.ticketUrl ? (
                        <a
                          href={event.ticketUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 ${
                            event.ticketsOnSale
                              ? 'bg-ozora-coral text-ozora-ink hover:bg-ozora-yellow focus-visible:ring-ozora-yellow'
                              : 'border border-ozora-turquoise/70 bg-ozora-turquoise/10 text-ozora-cream hover:bg-ozora-turquoise/20 focus-visible:ring-ozora-turquoise'
                          }`}
                          aria-label={fill(eventText(language, event.ticketsOnSale ? 'buyTicketsAria' : 'eventDetailsAria'), {
                            title: event.title,
                          })}
                        >
                          {event.ticketsOnSale ? (
                            <>
                              <Ticket size={16} aria-hidden="true" />
                              {eventText(language, 'buyTickets')}
                            </>
                          ) : (
                            <>
                              {eventText(language, 'eventDetails')}
                              <ExternalLink size={16} aria-hidden="true" />
                            </>
                          )}
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-ozora-cream/60">
                          <Clock size={16} aria-hidden="true" />
                          {eventText(language, 'comingSoon')}
                        </span>
                      )}
                      {event.timetableUrl ? (
                        <a
                          href={event.timetableUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-2 rounded-lg border border-ozora-turquoise/70 bg-ozora-turquoise/10 px-4 py-2 text-sm font-semibold text-ozora-cream hover:bg-ozora-turquoise/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
                          aria-label={fill(eventText(language, 'timetableAria'), { title: event.title })}
                        >
                          <CalendarClock size={16} aria-hidden="true" />
                          {eventText(language, 'timetable')}
                        </a>
                      ) : null}
                    </div>
                  </div>
                  {event.partners.length > 0 ? (
                    <div className="hidden shrink-0 flex-row items-center justify-center gap-3 md:flex md:self-center">
                      {event.partners.map((partner) => (
                        <div key={partner.id}>
                          {partner.href ? (
                            <a
                              href={partner.href}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="group focus-visible:outline-none"
                              aria-label={fill(eventText(language, 'partnerAria'), { name: partner.name })}
                              title={partner.name}
                            >
                              <PartnerMark partner={partner} />
                            </a>
                          ) : (
                            <span className="group" title={partner.name}>
                              <PartnerMark partner={partner} />
                            </span>
                          )}
                        </div>
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

function euroAmount(amount: number, language: string): string {
  return new Intl.NumberFormat(language === 'pt' ? 'pt-PT' : 'en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
}

function TicketPurchase({ event }: { event: UpcomingEventCard }) {
  const { language } = useLanguage();
  const [result, setResult] = useState<TicketActionResult | null>(null);
  const single = event.inAppOffers.length === 1 ? event.inAppOffers[0] : undefined;

  async function onSubmit(formEvent: FormEvent<HTMLFormElement>): Promise<void> {
    formEvent.preventDefault();
    setResult(await issueTicketAction(new FormData(formEvent.currentTarget)));
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-xs flex-col gap-2">
      <input type="hidden" name="partyId" value={event.id} />
      {single ? (
        <input type="hidden" name="offerName" value={single.name} />
      ) : (
        <SelectField
          name="offerName"
          ariaLabel={eventText(language, 'buyInApp')}
          defaultValue={event.inAppOffers[0]?.name ?? ''}
          options={event.inAppOffers.map((offer) => ({
            value: offer.name,
            label: offer.name,
            description: euroAmount(offer.amount, language),
          }))}
        />
      )}
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-ozora-coral px-4 py-2 text-sm font-semibold text-ozora-ink hover:bg-ozora-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow"
        aria-label={fill(eventText(language, 'buyInAppAria'), { title: event.title })}
      >
        <Ticket size={16} aria-hidden="true" />
        {single ? `${eventText(language, 'buyInApp')} · ${euroAmount(single.amount, language)}` : eventText(language, 'buyInApp')}
      </button>
      <p className="text-xs text-ozora-cream/70">{eventText(language, 'inAppNote')}</p>
      {result ? (
        <p role="status" className="text-sm text-ozora-yellow">
          {paymentNotice(language, result.notice)}
        </p>
      ) : null}
      {result?.notice === 'pending-provider' && result.ticketId ? (
        <a href={`/my-tickets?ticket=${result.ticketId}`} className="text-sm font-semibold text-ozora-turquoise underline-offset-2 hover:underline">
          {eventText(language, 'viewTickets')}
        </a>
      ) : null}
      {result?.notice === 'not-signed-in' ? (
        <a href="/account/sign-in" className="text-sm font-semibold text-ozora-turquoise underline-offset-2 hover:underline">
          {accountText(language, 'signIn')}
        </a>
      ) : null}
      {result?.notice === 'billing-required' ? (
        <a href="/account" className="text-sm font-semibold text-ozora-turquoise underline-offset-2 hover:underline">
          {paymentText(language, 'billingTitle')}
        </a>
      ) : null}
    </form>
  );
}

function PartnerMark({ partner }: { partner: UpcomingEventCard['partners'][number] }) {
  if (partner.logoSrc) {
    const fitContain = partner.logoFit === 'contain';
    return (
      <span
        className={`block h-20 w-20 overflow-hidden rounded-full shadow-lg shadow-black/50 transition duration-200 group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-ozora-pink/20 md:h-24 md:w-24 ${
          fitContain
            ? 'border border-amber-300/40 bg-[radial-gradient(circle_at_50%_38%,#17382b_0%,#07120e_58%,#020605_100%)] ring-2 ring-emerald-300/10'
            : 'border-2 border-white/25 bg-ozora-ink ring-1 ring-inset ring-white/10'
        }`}
      >
        <img
          src={partner.logoSrc}
          alt={`${partner.name} logo`}
          className={fitContain ? 'h-full w-full object-contain p-2' : 'h-full w-full object-cover'}
        />
      </span>
    );
  }
  const initials = partner.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-ozora-turquoise/50 to-ozora-pink/50 text-2xl font-black text-ozora-cream shadow-lg shadow-black/50 transition duration-200 group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-ozora-pink/20 md:h-24 md:w-24">
      {initials}
    </span>
  );
}
