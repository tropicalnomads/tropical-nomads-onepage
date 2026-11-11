'use client';

import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Locale } from 'tropical-nomads-shared';
import {
  eventArtists,
  eventDayKeys,
  filterCalendarEvents,
  formatDay,
  monthMatrix,
  uniqueLabels,
  weekdayLabels,
  type CalendarQuery,
  type CalendarWhen,
} from '../events/calendar';
import type { UpcomingEventCard } from '../events/types';
import { eventText, shellText } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';
import { EmptyState } from '../../../one-pager/src/components/EmptyState';
import { CalendarEventList } from './UpcomingEvents';
import { SelectField } from './ui/Select';
import { Button, IconButton } from './ui/Button';

const whenOptions = ['upcoming', 'past', 'all'] as const satisfies readonly CalendarWhen[];

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, value), template);
}

function monthStart(date: Date): { year: number; month: number } {
  return { year: date.getFullYear(), month: date.getMonth() };
}

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const next = new Date(year, month + delta, 1);
  return monthStart(next);
}

function whenLabel(when: CalendarWhen, language: Locale): string {
  switch (when) {
    case 'upcoming':
      return eventText(language, 'whenUpcoming');
    case 'past':
      return eventText(language, 'whenPast');
    case 'all':
      return eventText(language, 'whenAll');
    default: {
      const unexpected: never = when;
      return unexpected;
    }
  }
}

export function EventCalendar({ events, artistIds }: { events: readonly UpcomingEventCard[]; artistIds: Readonly<Record<string, string>> }) {
  const { language } = useLanguage();
  const locale = eventText(language, 'dateLocale');
  const initial = events.find((event) => event.when !== 'past') ?? events[0];
  const initialMonth = monthStart(initial ? new Date(initial.dateStart) : new Date());
  const [text, setText] = useState('');
  const [country, setCountry] = useState('');
  const [artist, setArtist] = useState('');
  const [when, setWhen] = useState<CalendarWhen>('all');
  const [day, setDay] = useState('');
  const [cursor, setCursor] = useState(initialMonth);
  const today = formatDay(new Date());
  const query = useMemo<CalendarQuery>(() => ({ text, country, artist, when, day }), [text, country, artist, when, day]);
  const filtered = useMemo(() => filterCalendarEvents(events, query), [events, query]);
  const marked = useMemo(() => filterCalendarEvents(events, { ...query, day: '' }), [events, query]);
  const marks = useMemo(() => {
    const days = new Map<string, { upcoming: boolean; past: boolean }>();
    for (const event of marked) {
      for (const key of eventDayKeys(event)) {
        const current = days.get(key) ?? { upcoming: false, past: false };
        if (event.when === 'past') {
          current.past = true;
        } else {
          current.upcoming = true;
        }
        days.set(key, current);
      }
    }
    return days;
  }, [marked]);
  const countries = uniqueLabels(events.map((event) => event.country));
  const artists = uniqueLabels(events.flatMap((event) => eventArtists(event)));
  const weeks = monthMatrix(cursor.year, cursor.month);
  const weekdays = weekdayLabels(locale);
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(cursor.year, cursor.month, 1));
  const upcomingCount = events.filter((event) => event.when !== 'past').length;
  const pastCount = events.length - upcomingCount;
  const filtersActive = text.trim() !== '' || country !== '' || artist !== '' || day !== '' || when !== 'all';

  function chooseDay(key: string): void {
    setDay((current) => (current === key ? '' : key));
    const [year, month] = key.split('-').map(Number);
    if (year !== undefined && month !== undefined) {
      setCursor({ year, month: month - 1 });
    }
  }

  function clearFilters(): void {
    setText('');
    setCountry('');
    setArtist('');
    setWhen('all');
    setDay('');
  }

  return (
    <section className="overflow-x-clip px-5 py-10 md:px-8 md:py-16">
      <div className="mx-auto max-w-[90rem]">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-ozora-yellow">{shellText(language, 'tagline')}</p>
        <h1 className="mt-2 max-w-3xl font-display text-4xl font-bold tracking-tight text-ozora-cream sm:text-5xl md:text-7xl">{shellText(language, 'calendar')}</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ozora-cream/75">{eventText(language, 'subtitle')}</p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <span className="rounded-full border border-ozora-yellow/40 bg-ozora-yellow/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-ozora-yellow">
            {upcomingCount} {eventText(language, 'whenUpcoming')}
          </span>
          <span className="rounded-full border border-white/10 bg-black/20 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-ozora-cream/65">
            {pastCount} {eventText(language, 'whenPast')}
          </span>
        </div>

        <div className="mt-10 grid items-start gap-7 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)] xl:gap-9">
          <aside className="rounded-[2rem] border border-white/10 bg-ozora-navy/70 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.28)] lg:sticky lg:top-24 xl:p-5">
            <div className="flex items-center justify-between gap-2">
              <IconButton label={eventText(language, 'previousMonth')} onClick={() => setCursor((current) => shiftMonth(current.year, current.month, -1))}>
                <ChevronLeft size={18} aria-hidden="true" />
              </IconButton>
              <h2 className="text-center font-display text-xl font-bold capitalize text-ozora-cream">{monthLabel}</h2>
              <IconButton label={eventText(language, 'nextMonth')} onClick={() => setCursor((current) => shiftMonth(current.year, current.month, 1))}>
                <ChevronRight size={18} aria-hidden="true" />
              </IconButton>
            </div>
            <div className="mt-5 grid grid-cols-7 gap-1 text-center text-[0.65rem] font-bold uppercase tracking-[0.16em] text-ozora-cream/45" aria-hidden="true">
              {weekdays.map((weekday) => (
                <span key={weekday}>{weekday}</span>
              ))}
            </div>
            <div className="mt-2.5 grid grid-cols-7 gap-1.5" role="grid" aria-label={eventText(language, 'calendarLabel')}>
              {weeks.flat().map((cell) => {
                const mark = marks.get(cell.key);
                const selected = day === cell.key;
                const isToday = cell.key === today;
                return (
                  <button
                    key={cell.key}
                    type="button"
                    role="gridcell"
                    aria-pressed={selected}
                    aria-label={cell.key}
                    onClick={() => chooseDay(cell.key)}
                    className={`relative flex min-h-11 items-center justify-center rounded-xl text-sm font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise focus-visible:ring-offset-2 focus-visible:ring-offset-ozora-navy sm:aspect-square ${
                      selected
                        ? 'bg-ozora-yellow text-ozora-ink shadow-lg shadow-ozora-yellow/20'
                        : cell.inMonth
                          ? 'bg-black/10 text-ozora-cream hover:bg-white/10'
                          : 'text-ozora-cream/30 hover:bg-white/5'
                    } ${isToday && !selected ? 'ring-2 ring-inset ring-ozora-turquoise' : ''}`}
                  >
                    {cell.date}
                    {mark ? (
                      <span className="absolute bottom-1.5 flex gap-1" aria-hidden="true">
                        {mark.upcoming ? <span className={`h-1.5 w-1.5 rounded-full ${selected ? 'bg-ozora-ink' : 'bg-ozora-yellow shadow-[0_0_8px_currentColor]'}`} /> : null}
                        {mark.past ? <span className={`h-1.5 w-1.5 rounded-full ${selected ? 'bg-ozora-ink/60' : 'bg-ozora-cream/40'}`} /> : null}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="min-w-0">
            <div className="rounded-[2rem] border border-white/10 bg-black/20 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.16)] md:p-5">
              <div className="grid gap-3 xl:grid-cols-12 xl:items-center">
                <div className="xl:col-span-5">
                  <label className="sr-only" htmlFor="event-calendar-search">
                    {eventText(language, 'searchLabel')}
                  </label>
                  <div className="relative rounded-xl bg-ozora-navy/40">
                    <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ozora-cream/50" />
                    <input
                      id="event-calendar-search"
                      type="text"
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                      placeholder={eventText(language, 'searchPlaceholder')}
                      autoComplete="off"
                      role="searchbox"
                      className="h-10 w-full rounded-xl border border-white/15 bg-black/25 py-2 pl-10 pr-12 text-sm text-ozora-cream placeholder:text-ozora-cream/40 outline-none transition focus:border-ozora-turquoise focus:ring-2 focus:ring-ozora-turquoise/25"
                    />
                    {text.trim() !== '' ? (
                      <button
                        type="button"
                        onClick={() => setText('')}
                        className="absolute right-0.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ozora-cream/70 transition hover:bg-white/10 hover:text-ozora-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
                        aria-label={eventText(language, 'clearSearch')}
                      >
                        <X size={16} aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-ozora-navy/35 p-1 xl:col-span-3" role="group" aria-label={eventText(language, 'whenAll')}>
                  {whenOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={when === option}
                      onClick={() => setWhen(option)}
                      className={`min-h-10 rounded-lg px-2 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise xl:min-h-8 ${
                        when === option ? 'bg-ozora-yellow text-ozora-ink shadow-md shadow-black/20' : 'text-ozora-cream/75 hover:bg-white/10 hover:text-ozora-cream'
                      }`}
                    >
                      {whenLabel(option, language)}
                    </button>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:col-span-4">
                  <SelectField
                    ariaLabel={eventText(language, 'countryLabel')}
                    value={country}
                    onChange={setCountry}
                    searchable
                    density="compact"
                    searchPlaceholder={eventText(language, 'searchPlaceholder')}
                    options={[{ value: '', label: eventText(language, 'countryAll') }, ...countries.map((name) => ({ value: name, label: name }))]}
                  />
                  <SelectField
                    ariaLabel={eventText(language, 'artistLabel')}
                    value={artist}
                    onChange={setArtist}
                    searchable
                    density="compact"
                    searchPlaceholder={eventText(language, 'artistSearch')}
                    emptyLabel={eventText(language, 'noResultsTitle')}
                    options={[{ value: '', label: eventText(language, 'artistAll') }, ...artists.map((name) => ({ value: name, label: name }))]}
                  />
                </div>
              </div>
              <div className="mt-3 flex min-h-10 flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                <p className="text-sm text-ozora-cream/65" aria-live="polite">
                  {fill(eventText(language, 'resultCount'), { shown: String(filtered.length), total: String(events.length) })}
                </p>
                {filtersActive ? (
                  <Button type="button" tone="ghost" size="sm" onClick={clearFilters}>
                    {eventText(language, 'clearFilters')}
                  </Button>
                ) : null}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="mt-6">
                <EmptyState title={eventText(language, 'noResultsTitle')} description={eventText(language, 'noResultsBody')} />
              </div>
            ) : (
              <div className="mt-6">
                <CalendarEventList events={filtered} embedded artistIds={artistIds} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
