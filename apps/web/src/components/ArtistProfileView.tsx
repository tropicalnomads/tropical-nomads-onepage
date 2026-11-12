'use client';

import { Calendar, Globe2, Instagram, Mail, MapPin, Music2, Ticket } from 'lucide-react';
import { formatEventDate, soundCloudPlayerUrl } from 'tropical-nomads-shared';
import { localizedArtistBio, type ArtistEventCard, type ArtistProfile } from '../artists/profile';
import { artistRequestMailto } from '../artists/request';
import { artistText, fillArtist } from '../i18n/artist-copy';
import { eventText } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';
import { ShopMarkdown } from '../shop/markdown';
import { Button } from './ui/Button';

export function ArtistProfileView({
  artist,
  upcoming,
  past,
}: {
  artist: ArtistProfile;
  upcoming: ArtistEventCard[];
  past: ArtistEventCard[];
}) {
  const { language } = useLanguage();
  const player = artist.soundcloud ? soundCloudPlayerUrl(artist.soundcloud) : undefined;
  const bio = localizedArtistBio(artist, language);
  const bookingMailto = artistRequestMailto(artist.name, 'booking');
  const appearanceCount = upcoming.length + past.length;
  const links = [
    artist.website ? { href: artist.website, label: artistText(language, 'website'), icon: <Globe2 size={15} aria-hidden="true" /> } : undefined,
    artist.instagram ? { href: artist.instagram, label: artistText(language, 'instagram'), icon: <Instagram size={15} aria-hidden="true" /> } : undefined,
    artist.soundcloud ? { href: artist.soundcloud, label: artistText(language, 'soundcloud'), icon: <Music2 size={15} aria-hidden="true" /> } : undefined,
  ].flatMap((link) => (link ? [link] : []));

  return (
    <main className="px-4 py-8 sm:px-6 md:px-8 md:py-12">
      <div className="mx-auto max-w-7xl">
        <Button href="/upcoming-events" tone="back" size="sm">
          {artistText(language, 'backToCalendar')}
        </Button>

        <article className="mt-5 overflow-hidden rounded-[2rem] border border-white/10 bg-ozora-navy/55 shadow-2xl shadow-black/15">
          <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-[14rem_minmax(0,1fr)] md:items-center lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10 lg:p-9">
            <div className="mx-auto w-full max-w-56 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/20 md:mx-0 lg:max-w-64">
              {artist.photo ? (
                <img src={artist.photo} alt={`${artist.name} portrait`} className="aspect-[4/5] w-full object-cover" />
              ) : (
                <div aria-hidden="true" className="flex aspect-[4/5] items-center justify-center bg-black/20 font-display text-6xl text-ozora-cream/30">
                  {artist.name.slice(0, 1)}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-ozora-yellow">{artistText(language, 'profileEyebrow')}</p>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h1 className="font-display text-4xl font-bold tracking-tight text-ozora-cream sm:text-5xl lg:text-6xl">{artist.name}</h1>
                {artist.country || artist.flag ? (
                  <p className="text-sm font-bold uppercase tracking-[0.12em] text-ozora-cream/65">
                    {[artist.flag, artist.country].filter((part) => part).join(' ')}
                  </p>
                ) : null}
              </div>
              {artist.genres.length > 0 ? <p className="mt-3 text-sm font-semibold uppercase tracking-[0.12em] text-ozora-turquoise">{artist.genres.join(' · ')}</p> : null}

              <div className="mt-5 flex flex-wrap gap-2">
                {links.map((link) => (
                  <Button key={link.href} href={link.href} tone="ghost" size="sm" icon={link.icon} target="_blank" rel="noreferrer noopener" aria-label={`${link.label} — ${artist.name}`}>
                    {link.label}
                  </Button>
                ))}
              </div>

              {bookingMailto ? (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                  <Button href={bookingMailto} size="sm" icon={<Mail size={15} aria-hidden="true" />}>
                    {artistText(language, 'bookArtist')}
                  </Button>
                </div>
              ) : null}

              <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10">
                <Stat value={appearanceCount} label={artistText(language, 'appearances')} />
                <Stat value={upcoming.length} label={artistText(language, 'upcoming')} />
                <Stat value={past.length} label={artistText(language, 'past')} />
              </div>

              {artist.agencies?.length ? (
                <div className="mt-5 border-l-2 border-ozora-coral pl-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ozora-coral">{artistText(language, 'representedBy')}</p>
                  <p className="mt-1 text-sm font-semibold text-ozora-cream">{artist.agencies.join(' · ')}</p>
                </div>
              ) : null}
            </div>
          </div>
        </article>

        {bio || player ? (
          <div className="mt-8 space-y-8">
            {bio ? (
              <section aria-labelledby="artist-about" className="rounded-[1.75rem] border border-white/10 bg-ozora-cream p-6 text-ozora-ink sm:p-8">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ozora-coral">{artistText(language, 'profileEyebrow')}</p>
                <h2 id="artist-about" className="mt-2 font-display text-2xl font-bold sm:text-3xl">{artistText(language, 'about')}</h2>
                <div className="mt-4 text-sm leading-7 text-ozora-ink/75 sm:text-base">
                  <ShopMarkdown text={bio} />
                </div>
              </section>
            ) : null}

            {player ? (
              <section aria-labelledby="artist-listen" className="rounded-[1.75rem] border border-white/10 bg-ozora-navy/55 p-5 sm:p-7">
                <h2 id="artist-listen" className="font-display text-2xl font-bold text-ozora-cream">{artistText(language, 'listen')}</h2>
                <iframe title={`${artistText(language, 'listen')}: ${artist.name}`} src={player} width="100%" height="166" className="mt-4 rounded-2xl" allow="autoplay" />
              </section>
            ) : null}
          </div>
        ) : null}

        <section className={bio || player ? 'mt-12' : 'mt-8'} aria-labelledby="event-history">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ozora-coral">{artistText(language, 'appearances')}</p>
              <h2 id="event-history" className="mt-1 font-display text-3xl font-bold text-ozora-cream">{artistText(language, 'eventHistory')}</h2>
            </div>
            <p className="text-sm text-ozora-cream/55">{appearanceCount}</p>
          </div>

          <EventGroup title={artistText(language, 'upcoming')} events={upcoming} language={language} />
          <EventGroup title={artistText(language, 'past')} events={past} language={language} quiet showTickets={false} />
        </section>
      </div>
    </main>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-ozora-navy/90 px-2 py-3 text-center sm:px-4">
      <p className="font-display text-2xl font-bold text-ozora-yellow">{value}</p>
      <p className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-[0.1em] text-ozora-cream/55 sm:text-[10px]">{label}</p>
    </div>
  );
}

function EventGroup({
  title,
  events,
  language,
  quiet = false,
  showTickets = true,
}: {
  title: string;
  events: ArtistEventCard[];
  language: 'en' | 'pt';
  quiet?: boolean;
  showTickets?: boolean;
}) {
  return (
    <div className="mt-7">
      <h3 className="text-xs font-black uppercase tracking-[0.18em] text-ozora-turquoise">{title}</h3>
      <EventList events={events} empty={artistText(language, 'noEvents')} language={language} quiet={quiet} showTickets={showTickets} />
    </div>
  );
}

function EventList({
  events,
  empty,
  language,
  quiet,
  showTickets,
}: {
  events: ArtistEventCard[];
  empty: string;
  language: 'en' | 'pt';
  quiet: boolean;
  showTickets: boolean;
}) {
  if (events.length === 0) {
    return <p className="mt-3 rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-ozora-cream/50">{empty}</p>;
  }
  return (
    <div className="mt-3 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10">
      {events.map((event) => {
        const area = [event.city, event.country].filter((part) => part).join(', ');
        const place = [event.venue, area].filter((part) => part).join(' - ') || event.place || artistText(language, 'venueFallback');
        const date = formatEventDate(
          {
            dateStart: event.date,
            ...(event.dateEnd ? { dateEnd: event.dateEnd } : {}),
            ...(event.timezone ? { timezone: event.timezone } : {}),
          },
          eventText(language, 'dateLocale'),
        );
        return (
          <article key={event.id} className={`flex gap-3 bg-ozora-navy/50 p-3 transition hover:bg-white/[0.06] sm:items-center sm:gap-5 ${quiet ? 'opacity-80 hover:opacity-100' : ''}`}>
            <a href={event.href} className="shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise" aria-label={`${artistText(language, 'viewEvent')}: ${event.title}`}>
              {event.flyer ? (
                <img src={event.flyer} alt={fillArtist(language, 'flyerAlt', { title: event.title })} className="h-24 w-[4.5rem] rounded-xl object-cover sm:w-20" />
              ) : (
                <span aria-hidden="true" className="flex h-24 w-[4.5rem] items-center justify-center rounded-xl bg-white/5 text-ozora-cream/25 sm:w-20">
                  <Music2 size={24} />
                </span>
              )}
            </a>

            <div className="min-w-0 flex-1">
              <a href={event.href} className={`rounded-sm font-display font-bold leading-tight text-ozora-cream underline-offset-4 transition hover:text-ozora-yellow hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise ${quiet ? 'text-xl' : 'text-2xl'}`}>
                {event.title}
              </a>
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-ozora-cream/75">
                <Calendar size={16} aria-hidden="true" />
                {date}
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm text-ozora-cream/75">
                <MapPin size={16} aria-hidden="true" className="shrink-0" />
                {event.mapUrl ? (
                  <a
                    href={event.mapUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-medium text-ozora-turquoise underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
                    aria-label={`${artistText(language, 'map')}: ${place}`}
                  >
                    {place}
                  </a>
                ) : (
                  <span>{place}</span>
                )}
              </p>
              {event.stageNames.length > 0 ? <p className="mt-1 text-xs text-ozora-cream/55">{event.stageNames.join(' · ')}</p> : null}
              {showTickets && event.ticketUrl ? (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 sm:hidden">
                  <a href={event.ticketUrl} target="_blank" rel="noreferrer noopener" className="text-xs font-bold text-ozora-yellow underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise">
                    {artistText(language, 'tickets')}
                  </a>
                </div>
              ) : null}
            </div>

            {showTickets && event.ticketUrl ? (
              <div className="hidden shrink-0 flex-wrap justify-end gap-2 sm:flex">
                <Button href={event.ticketUrl} target="_blank" rel="noreferrer noopener" size="sm" icon={<Ticket size={15} aria-hidden="true" />} aria-label={`${artistText(language, 'tickets')}: ${event.title}`}>
                  {artistText(language, 'tickets')}
                </Button>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
