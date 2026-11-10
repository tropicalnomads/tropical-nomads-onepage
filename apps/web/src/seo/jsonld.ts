import type { HomeEvent } from '../home/types.ts';
import { authorName, websiteDescription } from './copy.ts';
import { absoluteAsset, siteOrigin } from './urls.ts';

export const sameAs = [
  'https://www.instagram.com/tropicalnomads.events/',
  'https://www.instagram.com/tropicalnomadsbookings/',
  'https://bookings.tropical-nomads.com/',
] as const;

export interface SeoEventInput {
  title: string;
  dateStart?: string;
  dateEnd?: string;
  venueName?: string;
  city?: string;
  country?: string;
  image?: string;
  ticketUrl?: string;
  instagramPost?: string;
  goabaseUrl?: string;
  cardArtists?: readonly string[];
}

export interface MusicEventJson {
  '@type': 'MusicEvent';
  name: string;
  startDate: string;
  endDate?: string;
  eventStatus: 'https://schema.org/EventScheduled';
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode';
  location: {
    '@type': 'Place';
    name?: string;
    address: {
      '@type': 'PostalAddress';
      addressLocality?: string;
      addressCountry?: string;
    };
  };
  image?: string;
  url?: string;
  performer?: { '@type': 'MusicGroup'; name: string }[];
  organizer: {
    '@type': 'Organization';
    name: 'Tropical Nomads';
    url: string;
  };
}

export interface EventsItemList {
  '@context': 'https://schema.org';
  '@type': 'ItemList';
  name: 'Tropical Nomads Events';
  itemListElement: { '@type': 'ListItem'; position: number; item: MusicEventJson }[];
}

function present(value: string | undefined): string | undefined {
  if (!value || value.trim() === '') {
    return undefined;
  }
  return value;
}

function musicEvent(event: SeoEventInput): MusicEventJson | undefined {
  const startDate = present(event.dateStart);
  if (!startDate) {
    return undefined;
  }
  const placeName = present(event.venueName) ?? present(event.city);
  const endDate = present(event.dateEnd);
  const image = present(event.image);
  const url = present(event.ticketUrl) ?? present(event.instagramPost) ?? present(event.goabaseUrl);
  const artists = (event.cardArtists ?? []).filter((name) => name.trim() !== '');
  const item: MusicEventJson = {
    '@type': 'MusicEvent',
    name: event.title,
    startDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      ...(placeName ? { name: placeName } : {}),
      address: {
        '@type': 'PostalAddress',
        ...(present(event.city) ? { addressLocality: event.city } : {}),
        ...(present(event.country) ? { addressCountry: event.country } : {}),
      },
    },
    organizer: {
      '@type': 'Organization',
      name: 'Tropical Nomads',
      url: `${siteOrigin}/`,
    },
  };
  if (endDate) {
    item.endDate = endDate;
  }
  if (image) {
    item.image = absoluteAsset(image);
  }
  if (url) {
    item.url = url;
  }
  if (artists.length > 0) {
    item.performer = artists.map((name) => ({ '@type': 'MusicGroup', name }));
  }
  return item;
}

export function organizationWebsiteGraph(): {
  '@context': 'https://schema.org';
  '@graph': [Record<string, unknown>, Record<string, unknown>];
} {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteOrigin}/#organization`,
        name: authorName,
        url: `${siteOrigin}/`,
        logo: `${siteOrigin}/branding/tropical-nomads-logo-horizontal-clean.png`,
        image: `${siteOrigin}/og-image.png`,
        sameAs: [...sameAs],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteOrigin}/#website`,
        url: `${siteOrigin}/`,
        name: authorName,
        description: websiteDescription,
        publisher: { '@id': `${siteOrigin}/#organization` },
        inLanguage: ['en', 'pt'],
      },
    ],
  };
}

export function eventsItemList(events: readonly SeoEventInput[]): EventsItemList {
  const items = events.flatMap((event) => {
    const item = musicEvent(event);
    return item === undefined ? [] : [item];
  });
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Tropical Nomads Events',
    itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, item })),
  };
}

export function seoEventsFromHome(events: readonly HomeEvent[]): SeoEventInput[] {
  return events.map((event) => ({
    title: event.title,
    dateStart: event.dateStart,
    ...(event.dateEnd ? { dateEnd: event.dateEnd } : {}),
    ...(event.venueName ? { venueName: event.venueName } : {}),
    city: event.city,
    country: event.country,
    ...(event.schemaImage ? { image: event.schemaImage } : {}),
    ...(event.ticketUrl ? { ticketUrl: event.ticketUrl } : {}),
    ...(event.instagramPost ? { instagramPost: event.instagramPost } : {}),
    ...(event.goabaseUrl ? { goabaseUrl: event.goabaseUrl } : {}),
    cardArtists: event.cardArtists,
  }));
}

export function jsonLdText(value: unknown): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}
