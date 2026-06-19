import { useEffect } from 'react';
import { ExternalLink, Images, MapPin, Music, Video, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { EventRecord, MediaLink } from '@/lib/data';

interface LightboxModalProps {
  event: EventRecord | null;
  onClose: () => void;
}

function formatEventDate(dateStart: string): string {
  return new Intl.DateTimeFormat('en', { dateStyle: 'full' }).format(new Date(dateStart));
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

interface MediaSectionProps {
  title: string;
  icon: LucideIcon;
  links: MediaLink[];
}

function MediaSection({ title, icon: Icon, links }: MediaSectionProps): JSX.Element | null {
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

export function LightboxModal({ event, onClose }: LightboxModalProps): JSX.Element | null {
  useEffect(() => {
    if (!event) {
      return undefined;
    }

    const handleKeyDown = (keyEvent: KeyboardEvent): void => {
      if (keyEvent.key === 'Escape') {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [event, onClose]);

  if (!event) {
    return null;
  }

  const photos = event.media?.photos ?? [];
  const videos = event.media?.videos ?? [];
  const sets = event.media?.sets ?? [];
  const hasMedia = photos.length > 0 || videos.length > 0 || sets.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-ozora-navy"
      role="dialog"
      aria-modal="true"
      aria-label={`${event.title} details`}
    >
      <div className="safe-x sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-ozora-navy/90 px-5 py-3 backdrop-blur md:px-8">
        <span className="truncate pr-4 text-sm font-semibold text-ozora-cream/80">{event.title}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-ozora-cream transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow"
        >
          <X size={16} aria-hidden="true" />
          Close
        </button>
      </div>

      <div className="safe-x mx-auto max-w-4xl px-5 py-8 md:px-8">
        <h3 className="text-2xl font-bold text-ozora-cream md:text-3xl">{event.title}</h3>
        <p className="mt-1 text-sm text-ozora-cream/70">{formatEventDate(event.dateStart)}</p>
        <p className="mt-1 flex items-center gap-2 text-sm text-ozora-cream/70">
          <MapPin size={15} aria-hidden="true" />
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
              {event.venue.address ? ` (${event.venue.address})` : ''}
            </a>
          ) : (
            <span>
              {event.venue.name ? `${event.venue.name} - ` : ''}
              {event.venue.city}, {event.venue.country}
              {event.venue.address ? ` (${event.venue.address})` : ''}
            </span>
          )}
        </p>

        {event.images.bannerLocal ? (
          <div className="mx-auto mt-5 max-w-md overflow-hidden rounded-2xl">
            <img
              src={event.images.full ?? event.images.bannerLocal}
              alt={`${event.title} flyer`}
              className="h-auto w-full object-contain"
            />
          </div>
        ) : null}

        {event.description ? (
          <div className="mt-6 whitespace-pre-line text-sm leading-relaxed text-ozora-cream/85">
            {event.description}
          </div>
        ) : null}

        {event.stages.length > 0 ? (
          <div className="mt-6 space-y-4">
            {event.stages.map((stage) => (
              <div key={stage.name}>
                <h4 className="text-sm font-bold uppercase tracking-wide text-ozora-turquoise">
                  {stage.name}
                  {stage.genres.length > 0 ? (
                    <span className="ml-2 font-medium normal-case text-ozora-cream/60">
                      {stage.genres.join(', ')}
                    </span>
                  ) : null}
                </h4>
                <p className="mt-1 text-sm text-ozora-cream/80">
                  {stage.artists
                    .map((artist) => `${artist.countryFlag ? `${artist.countryFlag} ` : ''}${artist.name}`)
                    .join(' \u00b7 ')}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        <MediaSection title="Photos" icon={Images} links={photos} />
        <MediaSection title="Videos" icon={Video} links={videos} />
        <MediaSection title="Sets" icon={Music} links={sets} />

        {!hasMedia ? (
          <p className="mt-6 text-sm text-ozora-cream/50">Photos and videos coming soon.</p>
        ) : null}

        <a
          href={event.links.goabase}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-8 inline-flex items-center gap-2 rounded-lg border border-ozora-turquoise/70 bg-ozora-turquoise/10 px-4 py-2 text-sm font-medium text-ozora-cream transition hover:bg-ozora-turquoise/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
        >
          View on goabase
          <ExternalLink size={16} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
