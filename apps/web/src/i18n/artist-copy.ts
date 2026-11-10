import type { Locale } from 'tropical-nomads-shared';

const artistCopy = {
  en: {
    upcoming: 'Upcoming',
    past: 'Past events',
    listen: 'Listen',
    links: 'Links',
    noEvents: 'No events with this artist yet.',
    bookings: 'Bookings',
  },
  pt: {
    upcoming: 'Próximos',
    past: 'Eventos anteriores',
    listen: 'Ouvir',
    links: 'Links',
    noEvents: 'Ainda sem eventos com este artista.',
    bookings: 'Bookings',
  },
} as const;

export type ArtistCopyKey = keyof (typeof artistCopy)['en'];

export function artistText(language: Locale, key: ArtistCopyKey): string {
  return artistCopy[language][key];
}
