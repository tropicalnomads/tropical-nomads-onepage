import { publicHttpsUrl } from 'tropical-nomads-shared';
import type { ManagedParty } from 'tropical-nomads-api/parties';
import { uploadedEventFlyer } from './event-image';
import { bannerSrc } from '../events/assets';

export interface AdminOfferField {
  name: string;
  amount: string;
  capacity: string;
  ticket: string;
  endsAt: string;
}

export interface AdminEventValues {
  id?: string;
  title: string;
  dateStart: string;
  dateEnd: string;
  timezone: string;
  venueName: string;
  venueCity: string;
  description: string;
  imageUrl: string;
  artists: string;
  offers: AdminOfferField[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function emptyEventValues(): AdminEventValues {
  return {
    title: '',
    dateStart: '',
    dateEnd: '',
    timezone: '',
    venueName: '',
    venueCity: '',
    description: '',
    imageUrl: '',
    artists: '',
    offers: [{ name: '', amount: '', capacity: '', ticket: '', endsAt: '' }],
  };
}

export function eventValues(party: ManagedParty): AdminEventValues {
  const venue = isRecord(party.event.venue) ? party.event.venue : {};
  const images = party.event.images;
  const offers: AdminOfferField[] = Array.isArray(party.event.offers)
    ? party.event.offers.flatMap((offer) => {
        if (!isRecord(offer) || typeof offer.name !== 'string') {
          return [];
        }
        return [
          {
            name: offer.name,
            amount: typeof offer.amount === 'number' ? String(offer.amount) : '',
            capacity: typeof offer.capacity === 'number' ? String(offer.capacity) : '',
            ticket: typeof offer.ticket === 'string' ? offer.ticket : '',
            endsAt: typeof offer.endsAt === 'string' ? offer.endsAt : '',
          },
        ];
      })
    : [];
  return {
    id: party.id,
    title: party.event.title,
    dateStart: party.event.dateStart,
    dateEnd: text(party.event.dateEnd),
    timezone: text(party.event.timezone),
    venueName: text(venue.name),
    venueCity: text(venue.city),
    description: text(party.event.description),
    imageUrl: uploadedEventFlyer(text(images?.full)) ?? bannerSrc(text(images?.bannerLocal)) ?? publicHttpsUrl(text(images?.full)) ?? '',
    artists: (party.event.cardArtists ?? []).join('\n'),
    offers,
  };
}
