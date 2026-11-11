'use client';

import { CalendarClock, ExternalLink, Images, Instagram, MapPin, Music, Ticket, Video } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { formatEventDate } from 'tropical-nomads-shared';
import { ShopMarkdown } from '../../shop/markdown';
import type { HomeEvent, HomeMediaLink } from '../../home/types';
import { eventText, homeText, shellText } from '../../i18n/copy';
import { fillHome } from '../../i18n/home';
import { useLanguage } from '../../i18n/provider';
import { Button } from '../ui/Button';

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function MediaSection({ title, icon: Icon, links }: { title: string; icon: LucideIcon; links: readonly HomeMediaLink[] }) {
  if (links.length === 0) {
    return null;
  }
  return (
    <div className="mt-6">
      <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ozora-turquoise">
        <Icon size={16} aria-hidden="true" />
        {title}
      </h4>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-ozora-cream transition hover:border-ozora-turquoise/60 hover:bg-ozora-turquoise/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">{link.label ?? hostFromUrl(link.url)}</span>
              <span className="block truncate text-xs text-ozora-cream/55">{hostFromUrl(link.url)}</span>
            </span>
            <ExternalLink size={16} aria-hidden="true" className="shrink-0 text-ozora-cream/60" />
          </a>
        ))}
      </div>
    </div>
  );
}

export function EventDetails({ event }: { event: HomeEvent }) {
  const { language } = useLanguage();

  const hasMedia = event.photos.length > 0 || event.videos.length > 0 || event.sets.length > 0;
  const place = `${event.venueName ? `${event.venueName} - ` : ''}${event.city}, ${event.country}${event.address ? ` (${event.address})` : ''}`;

  return (
    <main className="px-5 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-6xl">
        <Button href="/upcoming-events" tone="back" size="sm">
          {shellText(language, 'calendar')}
        </Button>
        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(18rem,26rem)_minmax(0,1fr)] lg:gap-12">
          {event.bannerSrc ? (
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/20 shadow-2xl shadow-black/30 lg:sticky lg:top-24">
              <img
                src={event.bannerSrc}
                alt={fillHome(eventText(language, 'flyerAlt'), { title: event.title })}
                className="h-auto w-full object-contain"
              />
            </div>
          ) : null}
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-ozora-yellow">{shellText(language, 'tagline')}</p>
            <h1 className="mt-2 font-display text-4xl font-bold leading-tight text-ozora-cream md:text-6xl">{event.title}</h1>
            <p className="mt-5 text-sm font-semibold text-ozora-cream/75">{formatEventDate(event, homeText(language, 'dateLocale'), 'full')}</p>
            <p className="mt-2 flex items-start gap-2 text-sm text-ozora-cream/70">
          <MapPin size={15} aria-hidden="true" />
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
            <div className="mt-6 flex flex-wrap gap-3">
              {event.ticketUrl && event.ticketsOnSale ? (
                <Button href={event.ticketUrl} target="_blank" rel="noreferrer noopener" size="sm" icon={<Ticket size={16} aria-hidden="true" />}>
                  {homeText(language, 'buyTickets')}
                </Button>
              ) : null}
              {event.timetableUrl ? (
                <Button href={event.timetableUrl} target="_blank" rel="noreferrer noopener" tone="ghost" size="sm" icon={<CalendarClock size={16} aria-hidden="true" />}>
                  {homeText(language, 'timetable')}
                </Button>
              ) : null}
              {event.instagramPost ? (
                <Button href={event.instagramPost} target="_blank" rel="noreferrer noopener" tone="ghost" size="sm" icon={<Instagram size={16} aria-hidden="true" />}>
                  {eventText(language, 'memories')}
                </Button>
              ) : null}
            </div>
            {event.description ? (
              <div className="mt-8 text-base leading-relaxed text-ozora-cream/85">
                <ShopMarkdown text={event.description} />
              </div>
            ) : null}
            {event.stages.length > 0 ? (
              <div className="mt-8 space-y-5 rounded-[2rem] border border-white/10 bg-black/20 p-5 md:p-6">
                {event.stages.map((stage) => (
                  <div key={stage.name}>
                    <h2 className="text-sm font-bold uppercase tracking-wide text-ozora-turquoise">
                      {stage.name}
                      {stage.genres.length > 0 ? (
                        <span className="ml-2 font-medium normal-case text-ozora-cream/60">{stage.genres.join(', ')}</span>
                      ) : null}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-ozora-cream/80">
                      {stage.artists.map((artist) => `${artist.countryFlag ? `${artist.countryFlag} ` : ''}${artist.name}`).join(' · ')}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
            <MediaSection title={homeText(language, 'photos')} icon={Images} links={event.photos} />
            <MediaSection title={homeText(language, 'videos')} icon={Video} links={event.videos} />
            <MediaSection title={homeText(language, 'sets')} icon={Music} links={event.sets} />
            {hasMedia ? null : <p className="mt-8 text-sm text-ozora-cream/50">{homeText(language, 'mediaComingSoon')}</p>}
            {event.goabaseUrl ? (
              <a
                href={event.goabaseUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-8 inline-flex items-center gap-2 rounded-xl border border-ozora-turquoise/70 bg-ozora-turquoise/10 px-4 py-2 text-sm font-medium text-ozora-cream transition hover:bg-ozora-turquoise/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
              >
                {homeText(language, 'viewOnGoabase')}
                <ExternalLink size={16} aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
