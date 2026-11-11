'use client';

import { soundCloudPlayerUrl } from 'tropical-nomads-shared';
import { artistWhen, type ArtistEventCard, type ArtistProfile } from '../artists/profile';
import { artistText } from '../i18n/artist-copy';
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
  const links = [
    artist.instagram ? { href: artist.instagram, label: 'Instagram' } : undefined,
    artist.website ? { href: artist.website, label: artist.website.replace(/^https:\/\//, '') } : undefined,
    { href: 'https://bookings.tropical-nomads.com', label: artistText(language, 'bookings') },
  ].flatMap((link) => (link ? [link] : []));

  return (
    <main className="px-5 py-10 md:px-8 md:py-14">
      <article className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-ozora-navy/55">
          {artist.photo ? (
            <img src={artist.photo} alt="" className="aspect-square w-full object-cover" />
          ) : (
            <div className="flex aspect-square items-center justify-center bg-black/20 font-display text-6xl text-ozora-cream/30">{artist.name.slice(0, 1)}</div>
          )}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-ozora-yellow">{[artist.flag, artist.country].filter((part) => part).join(' ')}</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-ozora-cream md:text-5xl">{artist.name}</h1>
          {artist.genres.length > 0 ? <p className="mt-3 text-sm text-ozora-turquoise">{artist.genres.join(' · ')}</p> : null}
          {artist.bio ? (
            <div className="mt-6 text-sm leading-relaxed text-ozora-cream/80">
              <ShopMarkdown text={artist.bio} />
            </div>
          ) : null}
          {player ? (
            <div className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-ozora-turquoise">{artistText(language, 'listen')}</h2>
              <iframe title={artist.name} src={player} width="100%" height="166" className="mt-3 rounded-2xl" allow="autoplay" />
            </div>
          ) : null}
          {links.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {links.map((link) => (
                <Button key={link.href} href={link.href} tone="ghost" size="sm" target="_blank" rel="noreferrer noopener">
                  {link.label}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      </article>
      <section className="mx-auto mt-12 max-w-5xl">
        <h2 className="font-display text-2xl font-bold text-ozora-cream">{artistText(language, 'upcoming')}</h2>
        <EventList events={upcoming} empty={artistText(language, 'noEvents')} language={language} />
        <h2 className="mt-10 font-display text-2xl font-bold text-ozora-cream">{artistText(language, 'past')}</h2>
        <EventList events={past} empty={artistText(language, 'noEvents')} language={language} />
      </section>
    </main>
  );
}

function EventList({ events, empty, language }: { events: ArtistEventCard[]; empty: string; language: 'en' | 'pt' }) {
  if (events.length === 0) {
    return <p className="mt-4 text-sm text-ozora-cream/55">{empty}</p>;
  }
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      {events.map((event) => (
        <article key={event.id} className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-ozora-navy/40">
          {event.flyer ? <img src={event.flyer} alt="" className="aspect-[3/4] w-full object-cover" /> : null}
          <div className="p-4">
            <h3 className="font-display text-xl font-bold text-ozora-cream">{event.title}</h3>
            <p className="mt-1 text-sm text-ozora-turquoise">{artistWhen(event.when, language)}</p>
            {event.place ? <p className="mt-1 text-sm text-ozora-cream/60">{event.place}</p> : null}
          </div>
        </article>
      ))}
    </div>
  );
}
