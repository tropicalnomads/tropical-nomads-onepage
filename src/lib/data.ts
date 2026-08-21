import type {
  EventRecord,
  EventsFile,
  Partner,
  PartnerInstagram,
  PartnersFile,
} from '@/lib/types/event';

export type {
  EventRecord,
  EventStage,
  EventArtist,
  EventVenue,
  EventMedia,
  MediaLink,
  Partner,
  PartnerInstagram,
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

const TIMETABLE_ORIGIN = 'https://timetable.tropical-nomads.com';

export function getEventTimetableUrl(event: EventRecord): string | null {
  if (!event.timetableFestivalId) return null;
  const url = new URL(TIMETABLE_ORIGIN);
  url.searchParams.set('festival', event.timetableFestivalId);
  return url.toString();
}

export function getStageSummary(event: EventRecord, maxArtists = 4): string {
  const stageArtists = event.stages.flatMap((stage) => stage.artists.map((artist) => artist.name));
  // Featured names shown first: curated cardArtists when present, else the lineup.
  const featured =
    event.cardArtists && event.cardArtists.length > 0 ? event.cardArtists : stageArtists;
  if (featured.length === 0) {
    return '';
  }
  // Total reflects the full lineup so the "+N" count covers every artist, even
  // when only a few featured names are shown.
  const total = stageArtists.length > 0 ? stageArtists.length : featured.length;
  const shown = featured.slice(0, maxArtists);
  const remaining = total - shown.length;
  const shownText = shown.join(' \u00b7 ');
  return remaining > 0 ? `${shownText} +${remaining}` : shownText;
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

export function getPartnerInstagrams(partner: Partner): PartnerInstagram[] {
  if (partner.instagrams && partner.instagrams.length > 0) {
    return partner.instagrams;
  }
  return [{ handle: partner.handle, url: partner.instagram }];
}
