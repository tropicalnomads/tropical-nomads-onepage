import type { PartyPublication } from 'tropical-nomads-api/parties';
import { euroTicketOffers, formatEventDate, readTicketOffers, type PublicEventWhen } from 'tropical-nomads-shared';

export type EventPhase = 'draft' | 'published' | 'ended';

export interface EventBoardEvent extends PublicEventWhen {
  venue?: unknown;
  cardArtists?: readonly string[];
  offers?: unknown;
}

export interface EventBoardGroups<T> {
  comingUp: T[];
  ended: T[];
}

export interface EventDateStub {
  weekday: string;
  day: string;
  month: string;
}

export interface EventTicketSummary {
  typeCount: number;
  lowestEuro: number;
  capacity: number;
}

export interface EventBoardDetails {
  phase: EventPhase;
  place: string;
  lineup: string;
  when: string;
  stub?: EventDateStub;
  tickets?: EventTicketSummary;
}

type DatedParty = { publication: PartyPublication; event: { dateStart: string; dateEnd?: string } };
type DateOrder = 'asc' | 'desc';

function realInstant(value: string | undefined): number | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const text = value.trim();
  if (text === '') {
    return undefined;
  }
  const time = new Date(text).getTime();
  if (Number.isNaN(time)) {
    return undefined;
  }
  return time;
}

function publishedPhase(event: { dateStart: string; dateEnd?: string }, now: Date): 'published' | 'ended' {
  const finish = realInstant(event.dateEnd) ?? realInstant(event.dateStart);
  if (finish !== undefined && finish < now.getTime()) {
    return 'ended';
  }
  return 'published';
}

/** Draft stays draft. A published party ends at dateEnd when that is a real date, otherwise at dateStart. */
export function eventPhase(party: DatedParty, now: Date = new Date()): EventPhase {
  switch (party.publication) {
    case 'draft':
      return 'draft';
    case 'published':
      return publishedPhase(party.event, now);
    default: {
      const unreachable: never = party.publication;
      return unreachable;
    }
  }
}

function compareStart(left: DatedParty, right: DatedParty, order: DateOrder): number {
  const leftTime = realInstant(left.event.dateStart);
  const rightTime = realInstant(right.event.dateStart);
  if (leftTime === undefined && rightTime === undefined) {
    return 0;
  }
  if (leftTime === undefined) {
    return 1;
  }
  if (rightTime === undefined) {
    return -1;
  }
  const delta = leftTime - rightTime;
  switch (order) {
    case 'asc':
      return delta;
    case 'desc':
      return -delta;
    default: {
      const unreachable: never = order;
      return unreachable;
    }
  }
}

export function groupEventBoard<T extends DatedParty>(parties: readonly T[], now: Date = new Date()): EventBoardGroups<T> {
  const comingUp: T[] = [];
  const ended: T[] = [];
  for (const party of parties) {
    const phase = eventPhase(party, now);
    switch (phase) {
      case 'draft':
      case 'published':
        comingUp.push(party);
        break;
      case 'ended':
        ended.push(party);
        break;
      default: {
        const unreachable: never = phase;
        return unreachable;
      }
    }
  }
  comingUp.sort((left, right) => compareStart(left, right, 'asc'));
  ended.sort((left, right) => compareStart(left, right, 'desc'));
  return { comingUp, ended };
}

export function eventPhaseCounts<T extends DatedParty>(parties: readonly T[], now: Date = new Date()): Record<EventPhase, number> {
  const counts: Record<EventPhase, number> = { draft: 0, published: 0, ended: 0 };
  for (const party of parties) {
    const phase = eventPhase(party, now);
    switch (phase) {
      case 'draft':
      case 'published':
      case 'ended':
        counts[phase] += 1;
        break;
      default: {
        const unreachable: never = phase;
        return unreachable;
      }
    }
  }
  return counts;
}

export function eventTicketSummary(offers: unknown): EventTicketSummary | undefined {
  const tickets = euroTicketOffers(readTicketOffers(offers));
  const first = tickets[0];
  if (first === undefined) {
    return undefined;
  }
  let lowestEuro = first.amount;
  let capacity = 0;
  for (const ticket of tickets) {
    if (ticket.amount < lowestEuro) {
      lowestEuro = ticket.amount;
    }
    capacity += ticket.capacity;
  }
  return { typeCount: tickets.length, lowestEuro, capacity };
}

export function eventPlace(venue: unknown): string {
  if (typeof venue !== 'object' || venue === null || Array.isArray(venue)) {
    return '';
  }
  const record = venue as Record<string, unknown>;
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  const city = typeof record.city === 'string' ? record.city.trim() : '';
  return [name, city].filter((part) => part !== '').join(', ');
}

export function eventLineup(artists: readonly string[] | undefined): string {
  return (artists ?? []).map((name) => name.trim()).filter((name) => name !== '').join(' · ');
}

function zonedPart(date: Date, locale: string, options: Intl.DateTimeFormatOptions, timeZone: string | undefined): string {
  if (timeZone !== undefined && timeZone.trim() !== '') {
    try {
      return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(date);
    } catch {
      return new Intl.DateTimeFormat(locale, options).format(date);
    }
  }
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function eventDateStub(event: Pick<PublicEventWhen, 'dateStart' | 'timezone'>, locale: string): EventDateStub | undefined {
  const start = realInstant(event.dateStart);
  if (start === undefined) {
    return undefined;
  }
  const date = new Date(start);
  return {
    weekday: zonedPart(date, locale, { weekday: 'short' }, event.timezone),
    day: zonedPart(date, locale, { day: 'numeric' }, event.timezone),
    month: zonedPart(date, locale, { month: 'short' }, event.timezone),
  };
}

export function eventWhenLabel(event: PublicEventWhen, locale: string): string {
  if (realInstant(event.dateStart) === undefined) {
    return '';
  }
  const end = realInstant(event.dateEnd) === undefined ? undefined : event.dateEnd;
  const attempts: PublicEventWhen[] = [event, { dateStart: event.dateStart, dateEnd: end, durationHours: event.durationHours }, { dateStart: event.dateStart }];
  for (const attempt of attempts) {
    try {
      return formatEventDate(attempt, locale);
    } catch {
      // A bad timezone cannot take down the board.
    }
  }
  return '';
}

export function eventBoardDetails(
  party: { publication: PartyPublication; event: EventBoardEvent },
  locale: string,
  now: Date = new Date(),
): EventBoardDetails {
  const tickets = eventTicketSummary(party.event.offers);
  const stub = eventDateStub(party.event, locale);
  return {
    phase: eventPhase(party, now),
    place: eventPlace(party.event.venue),
    lineup: eventLineup(party.event.cardArtists),
    when: eventWhenLabel(party.event, locale),
    ...(stub === undefined ? {} : { stub }),
    ...(tickets === undefined ? {} : { tickets }),
  };
}
