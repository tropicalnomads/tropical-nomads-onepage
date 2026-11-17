import { publicHttpsUrl } from 'tropical-nomads-shared';
import type { ManagedParty } from 'tropical-nomads-api/parties';
import { uploadedEventFlyer } from './event-image';
import { bannerSrc } from '../events/assets';

export interface AdminGuestPersonField {
  id: string;
  name: string;
  email: string;
  observation: string;
}

export interface AdminGuestListField {
  id: string;
  name: string;
  amount: string;
  channel: 'door' | 'online';
  capacity: string;
  locked: boolean;
  used: boolean;
  participants: AdminGuestPersonField[];
}

function guestPeople(guests: readonly unknown[]): AdminGuestPersonField[] {
  return guests.flatMap((guest) => {
    if (typeof guest !== 'object' || guest === null || Array.isArray(guest)) {
      return [];
    }
    const row = guest as Record<string, unknown>;
    if (typeof row.id !== 'string' || typeof row.name !== 'string') {
      return [];
    }
    return [
      {
        id: row.id,
        name: row.name,
        email: typeof row.email === 'string' ? row.email : '',
        observation: typeof row.observation === 'string' ? row.observation : '',
      },
    ];
  });
}

export function defaultGuestListFields(): AdminGuestListField[] {
  return [
    { id: '', name: 'DJ', amount: '0', channel: 'door', capacity: '', locked: true, used: false, participants: [] },
    { id: '', name: 'Crew', amount: '0', channel: 'door', capacity: '', locked: true, used: false, participants: [] },
  ];
}

export function guestListFields(
  lists: readonly {
    id: string;
    name: string;
    amount: number;
    channel: 'door' | 'online';
    locked: boolean;
    capacity?: number;
    guests: readonly unknown[];
  }[],
  sold: Readonly<Record<string, number>>,
): AdminGuestListField[] {
  const mapped: AdminGuestListField[] = lists.map((list) => ({
    id: list.id,
    name: list.name,
    amount: String(list.amount),
    channel: list.channel,
    capacity: list.capacity === undefined ? '' : String(list.capacity),
    locked: list.locked,
    used: list.guests.length > 0 || (sold[list.name] ?? 0) > 0,
    participants: guestPeople(list.guests),
  }));
  const withDefaults = [...defaultGuestListFields().filter((item) => !mapped.some((list) => list.name === item.name)), ...mapped];
  return [
    ...withDefaults.filter((list) => list.name === 'DJ'),
    ...withDefaults.filter((list) => list.name === 'Crew'),
    ...withDefaults.filter((list) => list.name !== 'DJ' && list.name !== 'Crew'),
  ];
}

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
  venueId: string;
  venueName: string;
  venueCity: string;
  description: string;
  imageUrl: string;
  artists: string;
  headliners?: string[];
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
    venueId: '',
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
    venueId: text(venue.id),
    venueName: text(venue.name),
    venueCity: text(venue.city),
    description: text(party.event.description),
    imageUrl: uploadedEventFlyer(text(images?.full)) ?? bannerSrc(text(images?.bannerLocal)) ?? publicHttpsUrl(text(images?.full)) ?? '',
    artists: (party.event.cardArtists ?? []).join('\n'),
    ...(party.event.headliners ? { headliners: [...party.event.headliners] } : {}),
    offers,
  };
}
