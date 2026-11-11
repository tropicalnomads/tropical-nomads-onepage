import { api } from 'tropical-nomads-api';
import { decideAccess, eventSaleChoice, getEventTimetableUrl, publicHttpsUrl } from 'tropical-nomads-shared';
import { uploadedEventFlyer } from '../admin/event-image.ts';
import { apiOrigin } from '../api-origin.ts';
import { readHomeEvent } from '../home/catalog.ts';
import type { HomeEvent } from '../home/types.ts';
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

function readEvent(value: unknown, partners: Map<string, UpcomingPartner>, sold: Readonly<Record<string, number>>): UpcomingEventCard | undefined {
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
  const headliners = Array.isArray(value.headliners)
    ? value.headliners.flatMap((name) => (typeof name === 'string' && name.trim() !== '' ? [name.trim()] : []))
    : undefined;
  const dateEnd = readString(value.dateEnd);
  const timezone = readString(value.timezone);
  const venueName = readString(venue.name);
  const city = readString(venue.city);
  const country = readString(venue.country);
  const sale = eventSaleChoice(publicLinks, value.offers, new Date(), sold);
  const timetableUrl = getEventTimetableUrl(readString(value.timetableFestivalId));
  const fullImage = readString(images.full);
  const flyer = uploadedEventFlyer(fullImage) ?? bannerSrc(readString(images.bannerLocal)) ?? publicHttpsUrl(fullImage);
  const mapUrl = publicHttpsUrl(readString(venue.mapUrl));
  const instagramPost = publicHttpsUrl(readString(links.instagramPost));
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
    ...(headliners !== undefined ? { headliners } : {}),
    stages,
    inAppOffers: [...sale.inAppOffers],
    ...(sale.ticketUrl ? { ticketUrl: sale.ticketUrl } : {}),
    ticketsOnSale: sale.ticketsOnSale,
    ...(timetableUrl ? { timetableUrl } : {}),
    ...(flyer ? { bannerSrc: flyer } : {}),
    ...(instagramPost ? { instagramPost } : {}),
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

export interface TicketSaleCount {
  partyId: string;
  offerName: string;
  sold: number;
}

export async function loadTicketSales(): Promise<TicketSaleCount[]> {
  try {
    const body = await readCatalogJson('/ticket-sales');
    if (!isRecord(body) || !Array.isArray(body.sales)) {
      return [];
    }
    return body.sales.flatMap((item) => {
      if (!isRecord(item) || typeof item.partyId !== 'string' || typeof item.offerName !== 'string' || typeof item.sold !== 'number') {
        return [];
      }
      return [{ partyId: item.partyId, offerName: item.offerName, sold: item.sold }];
    });
  } catch {
    return [];
  }
}

function soldForParty(sales: readonly TicketSaleCount[], partyId: string): Record<string, number> {
  const sold: Record<string, number> = {};
  for (const sale of sales) {
    if (sale.partyId === partyId) {
      sold[sale.offerName] = sale.sold;
    }
  }
  return sold;
}

function readEventList(body: unknown, partners: Map<string, UpcomingPartner>, sales: readonly TicketSaleCount[]): UpcomingEventCard[] {
  if (!isRecord(body) || !Array.isArray(body.events)) {
    throw new Error('upcoming events are unavailable');
  }
  return body.events.flatMap((event) => {
    const id = isRecord(event) && typeof event.id === 'string' ? event.id : '';
    const card = readEvent(event, partners, soldForParty(sales, id));
    return card === undefined ? [] : [card];
  });
}

export async function loadUpcomingEvents(): Promise<UpcomingEventCard[]> {
  if (decideAccess({ action: 'read-published' }).effect !== 'allow') {
    return [];
  }
  const [eventsBody, partnersBody, sales] = await Promise.all([readCatalogJson('/events/upcoming'), readCatalogJson('/partners'), loadTicketSales()]);
  const partners = readPartners(partnersBody);
  return readEventList(eventsBody, partners, sales).map((event) => ({ ...event, when: 'upcoming' as const }));
}

export async function loadCalendarEvents(): Promise<UpcomingEventCard[]> {
  if (decideAccess({ action: 'read-published' }).effect !== 'allow') {
    return [];
  }
  const [upcomingBody, pastBody, partnersBody, sales] = await Promise.all([
    readCatalogJson('/events/upcoming'),
    readCatalogJson('/events/past'),
    readCatalogJson('/partners'),
    loadTicketSales(),
  ]);
  const partners = readPartners(partnersBody);
  const upcoming = readEventList(upcomingBody, partners, sales).map((event) => ({ ...event, when: 'upcoming' as const }));
  const seen = new Set(upcoming.map((event) => event.id));
  const past = readEventList(pastBody, partners, sales)
    .filter((event) => !seen.has(event.id))
    .sort((left, right) => new Date(right.dateStart).getTime() - new Date(left.dateStart).getTime())
    .map((event) => ({ ...event, when: 'past' as const }));
  return [...upcoming, ...past];
}

export async function loadPublicEvent(id: string): Promise<HomeEvent | undefined> {
  if (decideAccess({ action: 'read-published' }).effect !== 'allow') {
    return undefined;
  }
  const body = await readCatalogJson('/events');
  if (!isRecord(body) || !Array.isArray(body.events)) {
    throw new Error('events are unavailable');
  }
  const event = body.events.find((item) => isRecord(item) && item.id === id);
  return readHomeEvent(event);
}
