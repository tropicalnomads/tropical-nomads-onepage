import { useEffect } from 'react';
import { ExternalLink, MapPin, X } from 'lucide-react';
import type { EventRecord } from '@/lib/data';

interface LightboxModalProps {
  event: EventRecord | null;
  onClose: () => void;
}

function formatEventDate(dateStart: string): string {
  return new Intl.DateTimeFormat('en', { dateStyle: 'full' }).format(new Date(dateStart));
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

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [event, onClose]);

  if (!event) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${event.title} details`}
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/20 bg-ozora-navy p-4"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="absolute right-3 top-3 rounded-md bg-black/40 p-2 text-ozora-cream transition hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow"
        >
          <X size={18} aria-hidden="true" />
        </button>

        <h3 className="pr-10 text-xl font-semibold text-ozora-cream">{event.title}</h3>
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
          <div className="mt-4 overflow-hidden rounded-xl">
            <img
              src={event.images.full ?? event.images.bannerLocal}
              alt={`${event.title} flyer`}
              className="h-auto w-full object-contain"
            />
          </div>
        ) : null}

        {event.description ? (
          <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ozora-cream/85">
            {event.description}
          </div>
        ) : null}

        {event.stages.length > 0 ? (
          <div className="mt-5 space-y-4">
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

        <a
          href={event.links.goabase}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-ozora-turquoise/70 bg-ozora-turquoise/10 px-4 py-2 text-sm font-medium text-ozora-cream transition hover:bg-ozora-turquoise/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
        >
          View on goabase
          <ExternalLink size={16} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
