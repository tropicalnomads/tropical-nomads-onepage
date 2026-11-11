import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { eventDayKeys, filterCalendarEvents, monthMatrix, type CalendarEventFields } from '../src/events/calendar.ts';

function event(overrides: Partial<CalendarEventFields> & Pick<CalendarEventFields, 'id' | 'title' | 'dateStart'>): CalendarEventFields {
  return {
    cardArtists: [],
    stages: [],
    when: 'upcoming',
    ...overrides,
  };
}

describe('event calendar', () => {
  const events = [
    event({
      id: 'grove',
      title: 'Tropical Groove',
      dateStart: '2026-11-20T20:00:00.000Z',
      dateEnd: '2026-11-21T04:00:00.000Z',
      city: 'Dublin',
      country: 'Ireland',
      cardArtists: ['FNX', 'Deutsch'],
      when: 'upcoming',
    }),
    event({
      id: 'forest',
      title: 'Forest Shankara',
      dateStart: '2026-12-05T20:00:00-03:00',
      dateEnd: '2026-12-06T20:00:00-03:00',
      durationHours: 24,
      timezone: 'America/Sao_Paulo',
      city: 'Florianópolis',
      country: 'Brazil',
      stages: [{ artists: ['Elowinz', 'Cyk'] }],
      when: 'upcoming',
    }),
    event({
      id: 'athens',
      title: 'Showcase Athens',
      dateStart: '2026-10-04T21:00:00.000Z',
      city: 'Athens',
      country: 'Greece',
      cardArtists: ['Sakra'],
      when: 'past',
    }),
  ];

  it('searches artists, cities, and accented names', () => {
    assert.deepEqual(
      filterCalendarEvents(events, { text: 'fnx', country: '', artist: '', when: 'all', day: '' }).map((item) => item.id),
      ['grove'],
    );
    assert.deepEqual(
      filterCalendarEvents(events, { text: 'florianopolis', country: '', artist: '', when: 'all', day: '' }).map((item) => item.id),
      ['forest'],
    );
  });

  it('filters by country, artist, and when', () => {
    assert.deepEqual(
      filterCalendarEvents(events, { text: '', country: 'Brazil', artist: '', when: 'all', day: '' }).map((item) => item.id),
      ['forest'],
    );
    assert.deepEqual(
      filterCalendarEvents(events, { text: '', country: '', artist: 'Elowinz', when: 'all', day: '' }).map((item) => item.id),
      ['forest'],
    );
    assert.deepEqual(
      filterCalendarEvents(events, { text: '', country: '', artist: '', when: 'past', day: '' }).map((item) => item.id),
      ['athens'],
    );
  });

  it('keeps overnight parties on their start day and marks true multi-day events', () => {
    assert.deepEqual(eventDayKeys(events[0]!), ['2026-11-20']);
    assert.deepEqual(eventDayKeys(events[1]!), ['2026-12-05', '2026-12-06']);
  });

  it('starts the month on Monday', () => {
    const weeks = monthMatrix(2026, 10);
    assert.equal(weeks[0]?.[0]?.key, '2026-10-26');
    assert.equal(weeks[0]?.[0]?.inMonth, false);
  });
});
