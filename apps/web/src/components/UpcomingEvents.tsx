'use client';

import { Calendar, CalendarClock, Clock, ExternalLink, MapPin, Star, Ticket } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { formatEventDate } from 'tropical-nomads-shared';
import { localizedArtistBio } from '../artists/profile';
import { eventArtists, eventHeadliners, normalizeSearch } from '../events/calendar';
import type { ArtistPreview, UpcomingEventCard } from '../events/types';
import { useSignInHref } from '../account/use-return-path';
import { accountText, areaText, eventText, paymentNotice, paymentText } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';
import { issueTicketAction, type TicketActionResult } from '../tickets/actions';
import { EmptyState } from '../../../one-pager/src/components/EmptyState';
import { SelectField } from './SelectField';
import { Button, TextLink } from './ui/Button';

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, value), template);
}

function venueLabel(event: UpcomingEventCard): string {
  const place = [event.venueName, [event.city, event.country].filter(Boolean).join(', ')].filter(Boolean);
  return place.join(' - ');
}

function ArtistChip({ artist, preview, headliner }: { artist: string; preview: ArtistPreview | undefined; headliner: boolean }) {
  const tooltipId = useId();
  const { language } = useLanguage();
  if (!preview) {
    return (
      <li>
        <span
          className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
            headliner ? 'border-ozora-yellow/55 bg-ozora-yellow/15 text-ozora-yellow' : 'border-white/15 bg-black/10 text-ozora-cream/80'
          }`}
        >
          {headliner ? <Star size={12} fill="currentColor" aria-hidden="true" /> : null}
          {artist}
        </span>
      </li>
    );
  }
  const context = [preview.flag, preview.country, preview.genres.slice(0, 3).join(' · ')].filter(Boolean).join(' ');
  const bio = localizedArtistBio(preview, language);
  return (
    <li className="group/artist relative">
      <a
        href={`/artists/${encodeURIComponent(preview.id)}`}
        aria-describedby={tooltipId}
        className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise ${
          headliner
            ? 'border-ozora-yellow/55 bg-ozora-yellow/15 text-ozora-yellow hover:border-ozora-yellow hover:bg-ozora-yellow/25'
            : 'border-white/15 bg-black/10 text-ozora-cream/80 hover:border-ozora-coral/60 hover:bg-ozora-coral/10 hover:text-ozora-cream'
        }`}
      >
        {headliner ? <Star size={12} fill="currentColor" aria-hidden="true" /> : null}
        {artist}
      </a>
      <div
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-full left-1/2 z-50 mb-3 w-72 -translate-x-1/2 rounded-2xl border border-white/15 bg-ozora-navy/95 p-3 opacity-0 shadow-2xl shadow-black/50 backdrop-blur transition duration-150 group-hover/artist:visible group-hover/artist:opacity-100 group-focus-within/artist:visible group-focus-within/artist:opacity-100"
      >
        <div className="flex items-center gap-3">
          {preview.photo ? (
            <img src={preview.photo} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 font-display text-2xl font-bold text-ozora-cream/60">
              {preview.name.slice(0, 1)}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate font-display text-base font-bold text-ozora-cream">{preview.name}</span>
            {context ? <span className="mt-0.5 block text-xs leading-relaxed text-ozora-turquoise">{context}</span> : null}
          </span>
        </div>
        {bio ? <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-ozora-cream/70">{bio}</p> : null}
      </div>
    </li>
  );
}

export function CalendarEventList({
  events,
  embedded = false,
  artistPreviews = {},
}: {
  events: readonly UpcomingEventCard[];
  embedded?: boolean;
  artistPreviews?: Readonly<Record<string, ArtistPreview>>;
}) {
  const { language } = useLanguage();
  const label = areaText(language, 'upcoming-events');
  const firstUpcomingId = events.find((event) => event.when !== 'past')?.id;
  const groups = eventGroups(events, eventText(language, 'dateLocale'));

  const list = events.length === 0 ? (
    <div className="mt-6">
      <EmptyState title={eventText(language, 'emptyTitle')} description={eventText(language, 'emptyBody')} />
    </div>
  ) : (
    <div className={embedded ? 'space-y-9' : 'mt-8 space-y-9'}>
      {groups.map((group) => (
        <div key={group.key}>
          <h2 className="flex items-center gap-3 font-display text-2xl font-bold capitalize text-ozora-cream before:h-px before:w-6 before:bg-ozora-coral">{group.label}</h2>
          <div className="mt-5 grid gap-5">
            {group.events.map((event) => {
              const past = event.when === 'past';
              const highlighted = event.id === firstUpcomingId;
              const artists = eventArtists(event);
              const headliners = new Set(eventHeadliners(event).map(normalizeSearch));
              const place = venueLabel(event);
              const date = formatEventDate(event, eventText(language, 'dateLocale'));
              return (
                <article
                  key={event.id}
                  className={`relative isolate flex min-w-0 flex-col gap-5 overflow-visible rounded-[2rem] border p-4 transition duration-300 hover:z-20 focus-within:z-20 sm:flex-row sm:items-stretch ${
                    highlighted
                      ? 'border-ozora-yellow bg-ozora-yellow/10 shadow-glow sm:p-5 md:min-h-[19rem] md:p-6'
                      : past
                        ? 'border-white/10 bg-black/15 opacity-90 sm:p-4'
                        : 'border-white/10 bg-black/25 sm:p-5 hover:border-white/20'
                  }`}
                >
                  {event.bannerSrc ? (
                    <img
                      src={event.bannerSrc}
                      alt={fill(eventText(language, 'flyerAlt'), { title: event.title })}
                      className={`mx-auto aspect-[3/4] w-full max-w-[280px] shrink-0 self-start rounded-2xl object-cover shadow-2xl shadow-black/50 sm:mx-0 sm:aspect-auto sm:max-w-none ${
                        highlighted ? 'sm:h-80 sm:w-52 xl:w-60' : past ? 'sm:h-52 sm:w-36' : 'sm:h-64 sm:w-44'
                      } ${
                        highlighted ? 'ring-2 ring-ozora-yellow/70' : past ? 'saturate-[0.7]' : 'ring-1 ring-white/10'
                      }`}
                    />
                  ) : (
                    <div
                      className={`mx-auto flex aspect-[3/4] w-full max-w-[280px] shrink-0 self-start flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-ozora-navy/60 text-center sm:mx-0 sm:aspect-auto sm:max-w-none ${
                        highlighted ? 'sm:h-80 sm:w-52 xl:w-60' : past ? 'sm:h-52 sm:w-36' : 'sm:h-64 sm:w-44'
                      }`}
                    >
                      <Clock size={24} aria-hidden="true" className="text-ozora-cream/40" />
                      <span className="px-2 text-sm font-semibold uppercase tracking-wide text-ozora-cream/55">
                        {eventText(language, 'comingSoon')}
                      </span>
                    </div>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col py-1">
                    {highlighted ? (
                      <span className="mb-2 inline-flex w-fit items-center rounded-full border border-ozora-yellow/40 bg-ozora-yellow/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-ozora-yellow">
                        {eventText(language, 'nextUp')}
                      </span>
                    ) : past ? (
                      <span className="mb-2 inline-flex w-fit items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-ozora-cream/60">
                        {eventText(language, 'pastBadge')}
                      </span>
                    ) : null}
                    <h3 className={`font-display font-bold leading-tight text-ozora-cream ${highlighted ? 'text-2xl md:text-4xl' : past ? 'text-xl' : 'text-2xl'}`}>
                      <a
                        href={`/events/${encodeURIComponent(event.id)}`}
                        className="rounded-sm underline-offset-4 transition hover:text-ozora-yellow hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
                      >
                        {event.title}
                      </a>
                    </h3>
                    <p className={`${past ? 'mt-2' : 'mt-3'} flex items-center gap-2 text-sm font-medium text-ozora-cream/75`}>
                      <Calendar size={16} aria-hidden="true" />
                      {date}
                    </p>
                    {place ? (
                      <p className="mt-2 flex items-center gap-2 text-sm text-ozora-cream/75">
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
                    {artists.length > 0 ? (
                      <ul className={`${past ? 'mt-3' : 'mt-4'} flex flex-wrap gap-2`}>
                        {artists.map((artist) => (
                          <ArtistChip
                            key={artist}
                            artist={artist}
                            preview={artistPreviews[artist.trim().toLowerCase()]}
                            headliner={headliners.has(normalizeSearch(artist))}
                          />
                        ))}
                      </ul>
                    ) : null}
                    <div className={`mt-auto flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center ${past ? 'pt-4' : 'pt-5'}`}>
                      {past ? (
                        event.instagramPost ? (
                          <Button
                            href={event.instagramPost}
                            target="_blank"
                            rel="noreferrer noopener"
                            tone="ghost"
                            size="sm"
                            icon={<ExternalLink size={16} aria-hidden="true" />}
                          >
                            {eventText(language, 'memories')}
                          </Button>
                        ) : null
                      ) : event.inAppOffers.length > 0 ? (
                        <TicketPurchase event={event} />
                      ) : event.ticketUrl ? (
                        event.ticketsOnSale ? (
                          <Button
                            href={event.ticketUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            size="sm"
                            aria-label={fill(eventText(language, 'buyTicketsAria'), { title: event.title })}
                            icon={<Ticket size={16} aria-hidden="true" />}
                          >
                            {eventText(language, 'buyTickets')}
                          </Button>
                        ) : (
                          <a
                            href={event.ticketUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-ozora-turquoise/70 bg-ozora-turquoise/10 px-4 py-2 text-sm font-semibold text-ozora-cream transition hover:bg-ozora-turquoise/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
                            aria-label={fill(eventText(language, 'eventDetailsAria'), { title: event.title })}
                          >
                            {eventText(language, 'eventDetails')}
                            <ExternalLink size={16} aria-hidden="true" />
                          </a>
                        )
                      ) : (
                        <span className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-ozora-cream/60">
                          <Clock size={16} aria-hidden="true" />
                          {eventText(language, 'comingSoon')}
                        </span>
                      )}
                      {event.timetableUrl ? (
                        <a
                          href={event.timetableUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-ozora-turquoise/70 bg-ozora-turquoise/10 px-4 py-2 text-sm font-semibold text-ozora-cream hover:bg-ozora-turquoise/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
                          aria-label={fill(eventText(language, 'timetableAria'), { title: event.title })}
                        >
                          <CalendarClock size={16} aria-hidden="true" />
                          {eventText(language, 'timetable')}
                        </a>
                      ) : null}
                    </div>
                  </div>
                  {event.partners.length > 0 ? (
                    <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-t border-white/10 pt-4 sm:self-center sm:border-t-0 sm:pl-4 sm:pt-0">
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
        </div>
      ))}
    </div>
  );

  if (embedded) {
    return list;
  }

  return (
    <section className="overflow-x-clip px-5 py-10 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-3xl font-bold text-ozora-cream md:text-4xl">{label}</h1>
        <p className="mt-2 text-sm text-ozora-cream/75">{eventText(language, 'subtitle')}</p>
        {list}
      </div>
    </section>
  );
}

function eventGroups(events: readonly UpcomingEventCard[], locale: string): { key: string; label: string; events: UpcomingEventCard[] }[] {
  const groups: { key: string; label: string; events: UpcomingEventCard[] }[] = [];
  for (const event of events) {
    const date = new Date(event.dateStart);
    const valid = !Number.isNaN(date.getTime());
    const key = valid ? `${date.getFullYear()}-${date.getMonth()}` : event.id;
    const label = valid ? new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date) : event.title;
    const current = groups[groups.length - 1];
    if (current && current.key === key) {
      current.events.push(event);
      continue;
    }
    groups.push({ key, label, events: [event] });
  }
  return groups;
}

function euroAmount(amount: number, language: string): string {
  return new Intl.NumberFormat(language === 'pt' ? 'pt-PT' : 'en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
}

function TicketPurchase({ event }: { event: UpcomingEventCard }) {
  const { language } = useLanguage();
  const signInHref = useSignInHref();
  const [result, setResult] = useState<TicketActionResult | null>(null);
  const single = event.inAppOffers.length === 1 ? event.inAppOffers[0] : undefined;

  async function onSubmit(formEvent: FormEvent<HTMLFormElement>): Promise<void> {
    formEvent.preventDefault();
    setResult(await issueTicketAction(new FormData(formEvent.currentTarget)));
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-2.5 rounded-2xl border border-white/10 bg-black/15 p-3">
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
            description: `${euroAmount(offer.amount, language)} · ${fill(eventText(language, 'capacityLabel'), { count: String(offer.capacity) })}`,
          }))}
        />
      )}
      <Button type="submit" size="sm" aria-label={fill(eventText(language, 'buyInAppAria'), { title: event.title })} icon={<Ticket size={16} aria-hidden="true" />}>
        {single ? `${eventText(language, 'buyInApp')} · ${euroAmount(single.amount, language)}` : eventText(language, 'buyInApp')}
      </Button>
      <p className="text-xs text-ozora-cream/70">{eventText(language, 'inAppNote')}</p>
      {result ? (
        <p role="status" className="text-sm text-ozora-yellow">
          {paymentNotice(language, result.notice)}
        </p>
      ) : null}
      {result?.notice === 'ticket-ready' && result.ticketId ? (
        <TextLink href={`/my-tickets?ticket=${result.ticketId}`} className="text-sm">
          {eventText(language, 'viewTickets')}
        </TextLink>
      ) : null}
      {result?.notice === 'not-signed-in' ? (
        <TextLink href={signInHref} className="text-sm">
          {accountText(language, 'signIn')}
        </TextLink>
      ) : null}
      {result?.notice === 'billing-required' ? (
        <TextLink href="/account" className="text-sm">
          {paymentText(language, 'billingTitle')}
        </TextLink>
      ) : null}
    </form>
  );
}

function PartnerMark({ partner }: { partner: UpcomingEventCard['partners'][number] }) {
  if (partner.logoSrc) {
    const fitContain = partner.logoFit === 'contain';
    return (
      <span
        className={`block h-20 w-20 overflow-hidden rounded-full shadow-lg shadow-black/50 transition duration-200 group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-ozora-coral/20 md:h-24 md:w-24 ${
          fitContain
            ? 'border border-ozora-yellow/30 bg-ozora-navy ring-2 ring-ozora-yellow/10'
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
    <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-ozora-turquoise/50 to-ozora-coral/50 text-2xl font-black text-ozora-cream shadow-lg shadow-black/50 transition duration-200 group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-ozora-coral/20 md:h-24 md:w-24">
      {initials}
    </span>
  );
}
