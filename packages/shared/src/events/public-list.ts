/**
 * Rules for the public upcoming list.
 * The one-pager keeps its own copies in `apps/one-pager/src/lib/data.ts`.
 * A ticket link is an https URL. This file does not take payment.
 */

export interface PublicEventLinks {
  eventbrite?: string;
  tickets?: string;
  goabase?: string;
}

export interface PublicEventWhen {
  dateStart: string;
  dateEnd?: string;
  timezone?: string;
  durationHours?: number;
}

export interface PublicEventLineup {
  cardArtists?: readonly string[];
  stages?: readonly { artists?: readonly { name?: string }[] }[];
}

const timetableOrigin = 'https://timetable.tropical-nomads.com';

export function publicHttpsUrl(value: string | undefined): string | undefined {
  if (value === undefined || value.trim() === '') {
    return undefined;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username !== '' || url.password !== '') {
      return undefined;
    }
    return url.toString();
  } catch {
    return undefined;
  }
}

export function sortByDateAsc<T extends { dateStart: string }>(events: readonly T[]): T[] {
  return [...events].sort((left, right) => new Date(left.dateStart).getTime() - new Date(right.dateStart).getTime());
}

export function getPrimaryTicketUrl(links: PublicEventLinks): string | undefined {
  return publicHttpsUrl(links.eventbrite) ?? publicHttpsUrl(links.tickets) ?? publicHttpsUrl(links.goabase);
}

export function hasTicketSales(links: PublicEventLinks): boolean {
  return publicHttpsUrl(links.eventbrite) !== undefined || publicHttpsUrl(links.tickets) !== undefined;
}

export function getEventTimetableUrl(festivalId: string | undefined): string | undefined {
  if (festivalId === undefined || !/^[A-Za-z0-9_-]{1,80}$/.test(festivalId)) {
    return undefined;
  }
  const url = new URL(timetableOrigin);
  url.searchParams.set('festival', festivalId);
  if (url.origin !== timetableOrigin) {
    return undefined;
  }
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
  const value = (type: Intl.DateTimeFormatPartTypes): string => parts.find((part) => part.type === type)?.value ?? '';
  const hour = Number(value('hour'));
  return {
    key: `${value('year')}-${value('month')}-${value('day')}`,
    hour: Number.isFinite(hour) ? hour % 24 : 0,
  };
}

export function spansMultipleEventDays(event: PublicEventWhen): boolean {
  if (!event.dateEnd) {
    return false;
  }
  const timeZone = event.timezone || 'UTC';
  const start = zonedCalendar(new Date(event.dateStart), timeZone);
  const end = zonedCalendar(new Date(event.dateEnd), timeZone);
  if (start.key === end.key) {
    return false;
  }
  if ((event.durationHours ?? 0) >= 24) {
    return true;
  }
  return end.hour >= 18;
}

function formatSameMonthRange(start: Date, end: Date, formatter: Intl.DateTimeFormat): string {
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
  return startParts.map((part) => (part.type === 'day' ? `${part.value}–${endDay}` : part.value)).join('');
}

export function formatEventDate(event: PublicEventWhen, locale: string, dateStyle: 'full' | 'long' | 'medium' | 'short' = 'long'): string {
  const options: Intl.DateTimeFormatOptions = {
    dateStyle,
    ...(event.timezone ? { timeZone: event.timezone } : {}),
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

export function getStageSummary(event: PublicEventLineup, maxArtists = 4): string {
  const stageArtists = (event.stages ?? []).flatMap((stage) =>
    (stage.artists ?? []).map((artist) => artist.name).filter((name): name is string => typeof name === 'string' && name.trim() !== ''),
  );
  const featured = event.cardArtists && event.cardArtists.length > 0 ? [...event.cardArtists] : stageArtists;
  if (featured.length === 0) {
    return '';
  }
  const total = stageArtists.length > 0 ? stageArtists.length : featured.length;
  const shown = featured.slice(0, maxArtists);
  const remaining = total - shown.length;
  const shownText = shown.join(' · ');
  return remaining > 0 ? `${shownText} +${remaining}` : shownText;
}
