import type { EventRecord, EventsFile, Partner, PartnersFile } from '@/lib/types/event';

export type {
  EventRecord,
  EventStage,
  EventArtist,
  EventVenue,
  EventMedia,
  MediaLink,
  Partner,
} from '@/lib/types/event';

export interface SocialLink {
  id: string;
  platform: 'instagram' | 'facebook';
  label: string;
  handle: string;
  url: string;
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }
  return (await response.json()) as T;
}

export function startOfToday(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function isUpcomingEvent(event: EventRecord, today = startOfToday()): boolean {
  const start = new Date(event.dateStart);
  return start.getTime() >= today.getTime();
}

export function sortByDateAsc(events: EventRecord[]): EventRecord[] {
  return [...events].sort(
    (a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime(),
  );
}

export function sortByDateDesc(events: EventRecord[]): EventRecord[] {
  return [...events].sort(
    (a, b) => new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime(),
  );
}

export function getUpcomingEvents(events: EventRecord[]): EventRecord[] {
  return sortByDateAsc(events.filter((event) => isUpcomingEvent(event)));
}

export function getPastEvents(events: EventRecord[]): EventRecord[] {
  return sortByDateDesc(events.filter((event) => !isUpcomingEvent(event)));
}

export function getPrimaryTicketUrl(event: EventRecord): string {
  return event.links.eventbrite ?? event.links.tickets ?? event.links.goabase;
}

export function hasTicketSales(event: EventRecord): boolean {
  return Boolean(event.links.eventbrite ?? event.links.tickets);
}

export function getStageSummary(event: EventRecord, maxArtists = 4): string {
  const artists =
    event.cardArtists && event.cardArtists.length > 0
      ? event.cardArtists
      : event.stages.flatMap((stage) => stage.artists.map((artist) => artist.name));
  if (artists.length === 0) {
    return '';
  }
  const shown = artists.slice(0, maxArtists).join(' \u00b7 ');
  return artists.length > maxArtists ? `${shown} +${artists.length - maxArtists}` : shown;
}

export async function loadEvents(): Promise<EventRecord[]> {
  const file = await fetchJson<EventsFile>('/data/events.json');
  return file.events;
}

export async function loadSocialLinks(): Promise<SocialLink[]> {
  return fetchJson<SocialLink[]>('/data/socials.json');
}

export async function loadPartners(): Promise<Partner[]> {
  const file = await fetchJson<PartnersFile>('/data/partners.json');
  return file.partners;
}
