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
  const url = `${path}?v=${__APP_VERSION__}`;
  const response = await fetch(url, { cache: 'no-cache' });
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

function zonedCalendar(date: Date, timeZone: string): { key: string; hour: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '';
  const hour = Number(value('hour'));
  return {
    key: `${value('year')}-${value('month')}-${value('day')}`,
    hour: Number.isFinite(hour) ? hour % 24 : 0,
  };
}

/** True when the party occupies a second calendar day where it happens. */
export function spansMultipleEventDays(
  event: Pick<EventRecord, 'dateStart' | 'dateEnd' | 'timezone' | 'durationHours'>,
): boolean {
  if (!event.dateEnd) return false;
  const timeZone = event.timezone || 'UTC';
  const start = zonedCalendar(new Date(event.dateStart), timeZone);
  const end = zonedCalendar(new Date(event.dateEnd), timeZone);
  if (start.key === end.key) return false;
  if ((event.durationHours ?? 0) >= 24) return true;
  // Closing the next evening means the party occupied that day too.
  return end.hour >= 18;
}

function formatSameMonthRange(
  start: Date,
  end: Date,
  formatter: Intl.DateTimeFormat,
): string {
  const startParts = formatter.formatToParts(start);
  const endParts = formatter.formatToParts(end);
  const text = (parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '';
  const sameMonth = text(startParts, 'month') === text(endParts, 'month');
  const sameYear = text(startParts, 'year') === text(endParts, 'year');
  if (!sameMonth || !sameYear) {
    return `${formatter.format(start)} – ${formatter.format(end)}`;
  }
  const endDay = text(endParts, 'day');
  return startParts
    .map((part) => (part.type === 'day' ? `${part.value}–${endDay}` : part.value))
    .join('');
}

export function formatEventDate(
  event: Pick<EventRecord, 'dateStart' | 'dateEnd' | 'timezone' | 'durationHours'>,
  locale: string,
  dateStyle: 'full' | 'long' | 'medium' | 'short' = 'long',
): string {
  const timeZone = event.timezone;
  const options: Intl.DateTimeFormatOptions = {
    dateStyle,
    ...(timeZone ? { timeZone } : {}),
  };
  const formatter = new Intl.DateTimeFormat(locale, options);
  const start = new Date(event.dateStart);
  if (!event.dateEnd || !spansMultipleEventDays(event)) {
    return formatter.format(start);
  }
  const end = new Date(event.dateEnd);
  if (dateStyle === 'full') {
    return `${formatter.format(start)} – ${formatter.format(end)}`;
  }
  return formatSameMonthRange(start, end, formatter);
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
