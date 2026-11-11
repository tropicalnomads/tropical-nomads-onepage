import type { Locale } from 'tropical-nomads-shared';

const english = {
  upcoming: 'Upcoming',
  past: 'Past events',
  listen: 'Listen',
  links: 'Links',
  noEvents: 'No events with this artist yet.',
  bookings: 'Bookings',
  backToCalendar: 'Back to calendar',
  profileEyebrow: 'Artist profile',
  representedBy: 'Represented by Tropical Nomads',
  appearances: 'Appearances',
  upcomingCount: '{count} upcoming',
  pastCount: '{count} past',
  about: 'About',
  pressKitOnRequest: 'Press kit available on request.',
  requestPressKit: 'Request press kit',
  bookArtist: 'Book artist',
  eventHistory: 'Event history',
  venueFallback: 'Venue not listed',
  viewEvent: 'View event',
  website: 'Website',
  instagram: 'Instagram',
  soundcloud: 'SoundCloud',
  headliner: 'Headliner',
  flyerAlt: '{title} flyer',
  map: 'Map',
  tickets: 'Tickets',
} as const;

const portuguese = {
  upcoming: 'Próximos',
  past: 'Eventos anteriores',
  listen: 'Ouvir',
  links: 'Links',
  noEvents: 'Ainda sem eventos com este artista.',
  bookings: 'Bookings',
  backToCalendar: 'Voltar ao calendário',
  profileEyebrow: 'Perfil do artista',
  representedBy: 'Representado pela Tropical Nomads',
  appearances: 'Aparições',
  upcomingCount: '{count} próximos',
  pastCount: '{count} anteriores',
  about: 'Sobre',
  pressKitOnRequest: 'Press kit disponível sob consulta.',
  requestPressKit: 'Pedir press kit',
  bookArtist: 'Contratar artista',
  eventHistory: 'Histórico de eventos',
  venueFallback: 'Local não informado',
  viewEvent: 'Ver evento',
  website: 'Site',
  instagram: 'Instagram',
  soundcloud: 'SoundCloud',
  headliner: 'Headliner',
  flyerAlt: 'Cartaz de {title}',
  map: 'Mapa',
  tickets: 'Ingressos',
} as const satisfies { [Key in keyof typeof english]: string };

export const artistCopy = {
  en: english,
  pt: portuguese,
} as const satisfies Record<Locale, { [Key in keyof typeof english]: string }>;

export type ArtistCopyKey = keyof typeof english;

export function artistText(language: Locale, key: ArtistCopyKey): string {
  return artistCopy[language][key];
}

export function fillArtist(language: Locale, key: ArtistCopyKey, values: Record<string, string>): string {
  return Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), artistText(language, key));
}
