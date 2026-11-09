import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getEventTimetableUrl } from 'tropical-nomads-shared';
import { bannerSrc, onePagerPublicDir, partnerLogoSrc } from '../events/assets.ts';
import type { HomeCatalog, HomeEvent, HomeMediaLink, HomePartner, HomeSocial, HomeStage } from './types.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function httpsLink(value: unknown): string | undefined {
  const trimmed = readString(value);
  if (!trimmed) {
    return undefined;
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:' || url.username !== '' || url.password !== '') {
      return undefined;
    }
    return trimmed;
  } catch {
    return undefined;
  }
}

function readStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    const text = readString(item);
    return text === undefined ? [] : [text];
  });
}

function readMedia(value: unknown): HomeMediaLink[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }
    const url = httpsLink(item.url);
    if (!url) {
      return [];
    }
    const label = readString(item.label);
    return [label ? { url, label } : { url }];
  });
}

function readStages(value: unknown): HomeStage[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }
    const name = readString(item.name);
    if (!name) {
      return [];
    }
    const artists = Array.isArray(item.artists)
      ? item.artists.flatMap((artist) => {
          if (!isRecord(artist)) {
            return [];
          }
          const artistName = readString(artist.name);
          if (!artistName) {
            return [];
          }
          const countryFlag = readString(artist.countryFlag);
          return [countryFlag ? { name: artistName, countryFlag } : { name: artistName }];
        })
      : [];
    return [{ name, genres: readStringList(item.genres), artists }];
  });
}

function readLogoFit(value: unknown): HomePartner['logoFit'] {
  switch (value) {
    case 'cover':
    case 'contain':
      return value;
    default:
      return undefined;
  }
}

function readPlatform(value: unknown): HomeSocial['platform'] | undefined {
  switch (value) {
    case 'instagram':
    case 'facebook':
      return value;
    default:
      return undefined;
  }
}

function readEvent(value: unknown): HomeEvent | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const id = readString(value.id);
  const title = readString(value.title);
  const dateStart = readString(value.dateStart);
  const venue = isRecord(value.venue) ? value.venue : undefined;
  const city = venue ? readString(venue.city) : undefined;
  const country = venue ? readString(venue.country) : undefined;
  if (!id || !title || !dateStart || !city || !country || Number.isNaN(new Date(dateStart).getTime())) {
    return undefined;
  }
  const links = isRecord(value.links) ? value.links : {};
  const images = isRecord(value.images) ? value.images : {};
  const media = isRecord(value.media) ? value.media : {};
  const eventbrite = httpsLink(links.eventbrite);
  const tickets = httpsLink(links.tickets);
  const goabase = httpsLink(links.goabase);
  const ticketUrl = eventbrite ?? tickets ?? goabase;
  const dateEnd = readString(value.dateEnd);
  const timezone = readString(value.timezone);
  const venueName = venue ? readString(venue.name) : undefined;
  const address = venue ? readString(venue.address) : undefined;
  const mapUrl = venue ? httpsLink(venue.mapUrl) : undefined;
  const description = readString(value.description);
  const instagramPost = httpsLink(links.instagramPost);
  const timetableUrl = getEventTimetableUrl(readString(value.timetableFestivalId));
  const flyer = bannerSrc(readString(images.bannerLocal));
  const durationHours = typeof value.durationHours === 'number' && Number.isFinite(value.durationHours) ? value.durationHours : undefined;
  return {
    id,
    title,
    dateStart,
    ...(dateEnd ? { dateEnd } : {}),
    ...(timezone ? { timezone } : {}),
    ...(durationHours !== undefined ? { durationHours } : {}),
    ...(venueName ? { venueName } : {}),
    city,
    country,
    ...(address ? { address } : {}),
    ...(mapUrl ? { mapUrl } : {}),
    cardArtists: readStringList(value.cardArtists),
    stages: readStages(value.stages),
    ...(description ? { description } : {}),
    ...(flyer ? { bannerSrc: flyer } : {}),
    ...(ticketUrl ? { ticketUrl } : {}),
    ticketsOnSale: eventbrite !== undefined || tickets !== undefined,
    ...(timetableUrl ? { timetableUrl } : {}),
    ...(instagramPost ? { instagramPost } : {}),
    ...(goabase ? { goabaseUrl: goabase } : {}),
    partnerIds: readStringList(value.partnerIds),
    photos: readMedia(media.photos),
    videos: readMedia(media.videos),
    sets: readMedia(media.sets),
  };
}

function readPartner(value: unknown): HomePartner | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const id = readString(value.id);
  const name = readString(value.name);
  const city = readString(value.city);
  const handle = readString(value.handle);
  const instagram = httpsLink(value.instagram);
  if (!id || !name || !city || !handle || !instagram) {
    return undefined;
  }
  const listed = Array.isArray(value.instagrams)
    ? value.instagrams.flatMap((account) => {
        if (!isRecord(account)) {
          return [];
        }
        const accountHandle = readString(account.handle);
        const url = httpsLink(account.url);
        if (!accountHandle || !url) {
          return [];
        }
        return [{ handle: accountHandle, url }];
      })
    : [];
  const logoSrc = partnerLogoSrc(readString(value.logo));
  const logoFit = readLogoFit(value.logoFit);
  return {
    id,
    name,
    city,
    handle,
    instagram,
    instagrams: listed.length > 0 ? listed : [{ handle, url: instagram }],
    ...(logoSrc ? { logoSrc } : {}),
    ...(logoSrc && logoFit ? { logoFit } : {}),
  };
}

function readSocial(value: unknown): HomeSocial | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const id = readString(value.id);
  const platform = readPlatform(value.platform);
  const label = readString(value.label);
  const handle = readString(value.handle);
  const url = httpsLink(value.url);
  if (!id || !platform || !label || !handle || !url) {
    return undefined;
  }
  return { id, platform, label, handle, url };
}

function readJson(fileName: string): unknown {
  return JSON.parse(readFileSync(join(onePagerPublicDir(), 'data', fileName), 'utf8')) as unknown;
}

export function loadHomeCatalog(): HomeCatalog {
  const eventsFile = readJson('events.json');
  const partnersFile = readJson('partners.json');
  const socialsFile = readJson('socials.json');
  if (!isRecord(eventsFile) || !Array.isArray(eventsFile.events)) {
    throw new Error('events are unavailable');
  }
  if (!isRecord(partnersFile) || !Array.isArray(partnersFile.partners)) {
    throw new Error('partners are unavailable');
  }
  if (!Array.isArray(socialsFile)) {
    throw new Error('social links are unavailable');
  }
  const events = eventsFile.events.flatMap((event) => {
    const card = readEvent(event);
    return card === undefined ? [] : [card];
  });
  const partners = partnersFile.partners.flatMap((partner) => {
    const card = readPartner(partner);
    return card === undefined ? [] : [card];
  });
  const socials = socialsFile.flatMap((link) => {
    const card = readSocial(link);
    return card === undefined ? [] : [card];
  });
  const follow = socials.find((link) => link.id === 'instagram-tropical-nomads');
  if (!follow) {
    throw new Error('the journey link is unavailable');
  }
  return { events, partners, socials, followHref: follow.url };
}
