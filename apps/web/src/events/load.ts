import { decideAccess, eventSaleChoice, getEventTimetableUrl, publicHttpsUrl } from 'tropical-nomads-shared';
import { api } from 'tropical-nomads-api';
import { apiOrigin } from '../api-origin.ts';
import { bannerSrc, partnerLogoSrc } from './assets.ts';
import type { UpcomingEventCard, UpcomingPartner } from './types.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function readArtists(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((artist) => {
    if (!isRecord(artist)) {
      return [];
    }
    const name = readString(artist.name);
    return name === undefined ? [] : [name];
  });
}

function readPartners(value: unknown): Map<string, UpcomingPartner> {
  const partners = new Map<string, UpcomingPartner>();
  if (!isRecord(value) || !Array.isArray(value.partners)) {
    return partners;
  }
  for (const partner of value.partners) {
    if (!isRecord(partner)) {
      continue;
    }
    const id = readString(partner.id);
    const name = readString(partner.name);
    if (!id || !name) {
      continue;
    }
    const href = publicHttpsUrl(readString(partner.instagram));
    const logoSrc = partnerLogoSrc(readString(partner.logo));
    const logoFit = partner.logoFit === 'contain' ? 'contain' : partner.logoFit === 'cover' ? 'cover' : undefined;
    partners.set(id, {
      id,
      name,
      ...(href ? { href } : {}),
      ...(logoSrc ? { logoSrc } : {}),
      ...(logoFit ? { logoFit } : {}),
    });
  }
  return partners;
}

function readEvent(value: unknown, partners: Map<string, UpcomingPartner>): UpcomingEventCard | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const id = readString(value.id);
  const title = readString(value.title);
  const dateStart = readString(value.dateStart);
  if (!id || !title || !dateStart) {
    return undefined;
  }
  const links = isRecord(value.links) ? value.links : {};
  const publicLinks = {
    eventbrite: readString(links.eventbrite),
    tickets: readString(links.tickets),
    goabase: readString(links.goabase),
  };
  const venue = isRecord(value.venue) ? value.venue : {};
  const images = isRecord(value.images) ? value.images : {};
  const partnerIds = Array.isArray(value.partnerIds) ? value.partnerIds : [];
  const matched = partnerIds.flatMap((partnerId) => {
    if (typeof partnerId !== 'string') {
      return [];
    }
    const partner = partners.get(partnerId);
    return partner === undefined ? [] : [partner];
  });
  const stages = Array.isArray(value.stages)
    ? value.stages.map((stage) => ({ artists: isRecord(stage) ? readArtists(stage.artists) : [] }))
    : [];
  const cardArtists = Array.isArray(value.cardArtists)
    ? value.cardArtists.filter((name): name is string => typeof name === 'string' && name.trim() !== '')
    : [];
  const dateEnd = readString(value.dateEnd);
  const timezone = readString(value.timezone);
  const venueName = readString(venue.name);
  const city = readString(venue.city);
  const country = readString(venue.country);
  const sale = eventSaleChoice(publicLinks, value.offers);
  const timetableUrl = getEventTimetableUrl(readString(value.timetableFestivalId));
  const flyer = bannerSrc(readString(images.bannerLocal));
  const mapUrl = publicHttpsUrl(readString(venue.mapUrl));
  const durationHours = typeof value.durationHours === 'number' && Number.isFinite(value.durationHours) ? value.durationHours : undefined;
  return {
    id,
    title,
    dateStart,
    ...(dateEnd ? { dateEnd } : {}),
    ...(timezone ? { timezone } : {}),
    ...(durationHours !== undefined ? { durationHours } : {}),
    ...(venueName ? { venueName } : {}),
    ...(city ? { city } : {}),
    ...(country ? { country } : {}),
    ...(mapUrl ? { mapUrl } : {}),
    cardArtists,
    stages,
    inAppOffers: [...sale.inAppOffers],
    ...(sale.ticketUrl ? { ticketUrl: sale.ticketUrl } : {}),
    ticketsOnSale: sale.ticketsOnSale,
    ...(timetableUrl ? { timetableUrl } : {}),
    ...(flyer ? { bannerSrc: flyer } : {}),
    partners: matched,
  };
}

async function readCatalogJson(path: string): Promise<unknown> {
  const origin = apiOrigin();
  if (origin) {
    const response = await fetch(`${origin}${path}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('upcoming events are unavailable');
    }
    return response.json();
  }
  const response = await api.request(path);
  if (response.status !== 200) {
    throw new Error('upcoming events are unavailable');
  }
  return response.json();
}

export async function loadUpcomingEvents(): Promise<UpcomingEventCard[]> {
  if (decideAccess({ action: 'read-published' }).effect !== 'allow') {
    return [];
  }
  const eventsBody = await readCatalogJson('/events/upcoming');
  const partnersBody = await readCatalogJson('/partners');
  if (!isRecord(eventsBody) || !Array.isArray(eventsBody.events)) {
    throw new Error('upcoming events are unavailable');
  }
  const partners = readPartners(partnersBody);
  return eventsBody.events.flatMap((event) => {
    const card = readEvent(event, partners);
    return card === undefined ? [] : [card];
  });
}
