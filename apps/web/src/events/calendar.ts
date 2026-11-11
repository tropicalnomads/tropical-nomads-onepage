export type CalendarWhen = 'upcoming' | 'past' | 'all';

export interface CalendarEventFields {
  id: string;
  title: string;
  dateStart: string;
  dateEnd?: string;
  durationHours?: number;
  timezone?: string;
  venueName?: string;
  city?: string;
  country?: string;
  cardArtists: readonly string[];
  stages: readonly { artists: readonly string[] }[];
  when?: 'upcoming' | 'past';
}

export interface CalendarQuery {
  text: string;
  country: string;
  artist: string;
  when: CalendarWhen;
  day: string;
}

export interface CalendarDay {
  key: string;
  date: number;
  inMonth: boolean;
}

const headlinersByEventId: Readonly<Record<string, readonly string[]>> = {
  '115995': ['After June', "Blazin'G", 'Shivaion'],
  '115553': ['Alien Noise', 'Atohmic'],
  '116643': ['Bocara', 'Dirty Saffi', 'Psymmetrix'],
  '116906': ['Adrenaline Rush'],
  '117120': ['Altered State', 'Burn in Noise'],
  '117152': ['Burn in Noise'],
  '117257': ['Candelas', 'Cosmic Brothers Project', 'Texo'],
  '117712': ['Avan7', 'Back to Mars', 'Brain Damage', 'Psychological', 'Yesca'],
  '117713': ['Avan7', 'Brain Damage', 'Frostbite', 'Psychological'],
  '118006': ['ARAM', 'Deutsch', 'Jungle Rumble', 'Technology'],
  '118352': ['3rd Vision', 'FNX', 'Valkyrie'],
  'forest-shankara-sacred-pulse-2026': [
    'Alien Coffee',
    'Bocara',
    'Cyk',
    'Dezzert',
    'Elowinz',
    'FNX',
    'Inside Mind',
    'Psychological',
    'Sabedoria',
    'Sartor',
    'Total Illusion',
  ],
};

export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function eventArtists(event: CalendarEventFields): string[] {
  const names = [...event.cardArtists, ...event.stages.flatMap((stage) => stage.artists)];
  const seen = new Set<string>();
  const artists: string[] = [];
  for (const name of names) {
    const trimmed = name.trim();
    const key = normalizeSearch(trimmed);
    if (key === '' || seen.has(key)) {
      continue;
    }
    seen.add(key);
    artists.push(trimmed);
  }
  return artists.sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' }));
}

export function eventHeadliners(event: CalendarEventFields): string[] {
  const override = headlinersByEventId[event.id];
  if (override) {
    return [...override];
  }
  const title = normalizeSearch(event.title);
  const namedInTitle = eventArtists(event).filter((artist) => title.includes(normalizeSearch(artist)));
  const selected = namedInTitle.length > 0 ? namedInTitle : event.cardArtists;
  return uniqueLabels(selected);
}

export function uniqueLabels(values: readonly (string | undefined)[]): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const value of values) {
    const trimmed = value?.trim() ?? '';
    const key = normalizeSearch(trimmed);
    if (key === '' || seen.has(key)) {
      continue;
    }
    seen.add(key);
    labels.push(trimmed);
  }
  return labels.sort((left, right) => left.localeCompare(right));
}

export function formatDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function eventLocalDay(date: Date, timezone: string | undefined): string {
  if (!timezone) {
    return formatDay(date);
  }
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;
    return year && month && day ? `${year}-${month}-${day}` : formatDay(date);
  } catch {
    return formatDay(date);
  }
}

function utcDay(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));
}

function formatUtcDay(date: Date): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}-${month}-${day}`;
}

export function eventDayKeys(event: Pick<CalendarEventFields, 'dateStart' | 'dateEnd' | 'durationHours' | 'timezone'>): string[] {
  const start = new Date(event.dateStart);
  if (Number.isNaN(start.getTime())) {
    return [];
  }
  const end = event.dateEnd ? new Date(event.dateEnd) : start;
  const last = Number.isNaN(end.getTime()) || end.getTime() < start.getTime() ? start : end;
  const durationHours = event.durationHours ?? (last.getTime() - start.getTime()) / 3_600_000;
  const startDay = eventLocalDay(start, event.timezone);
  if (durationHours < 18) {
    return [startDay];
  }
  const cursor = utcDay(startDay);
  const stop = utcDay(eventLocalDay(last, event.timezone));
  const keys: string[] = [];
  for (let guard = 0; guard < 21 && cursor.getTime() <= stop.getTime(); guard += 1) {
    keys.push(formatUtcDay(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

export function filterCalendarEvents<T extends CalendarEventFields>(events: readonly T[], query: CalendarQuery): T[] {
  const tokens = normalizeSearch(query.text).split(/\s+/).filter(Boolean);
  const artist = normalizeSearch(query.artist);
  const country = normalizeSearch(query.country);
  return events.filter((event) => {
    if (query.when !== 'all' && event.when !== query.when) {
      return false;
    }
    if (country !== '' && normalizeSearch(event.country ?? '') !== country) {
      return false;
    }
    if (artist !== '' && !eventArtists(event).some((name) => normalizeSearch(name) === artist)) {
      return false;
    }
    if (query.day !== '' && !eventDayKeys(event).includes(query.day)) {
      return false;
    }
    if (tokens.length === 0) {
      return true;
    }
    const haystack = normalizeSearch([event.title, event.venueName ?? '', event.city ?? '', event.country ?? '', ...eventArtists(event)].join(' '));
    return tokens.every((token) => haystack.includes(token));
  });
}

export function monthMatrix(year: number, month: number): CalendarDay[][] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startOffset);
  const weeks: CalendarDay[][] = [];
  for (let week = 0; week < 6; week += 1) {
    const days: CalendarDay[] = [];
    for (let day = 0; day < 7; day += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + week * 7 + day);
      days.push({
        key: formatDay(date),
        date: date.getDate(),
        inMonth: date.getMonth() === month,
      });
    }
    weeks.push(days);
  }
  const lastWeek = weeks[5];
  if (lastWeek !== undefined && lastWeek.every((day) => !day.inMonth)) {
    weeks.pop();
  }
  return weeks;
}

export function weekdayLabels(locale: string): string[] {
  const monday = new Date(2026, 0, 5);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date);
  });
}
