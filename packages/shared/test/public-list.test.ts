import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatEventDate, getEventTimetableUrl, getPrimaryTicketUrl, getStageSummary, hasTicketSales, sortByDateAsc, spansMultipleEventDays } from '../src/events/public-list.ts';
import { knownTimeZone } from '../src/events/time-zone.ts';

const fixture = {
  id: 'tropical-groove-2026-11-20',
  title: 'Tropical Groove',
  dateStart: '2026-11-20T19:00:00+00:00',
  dateEnd: '2026-11-21T02:45:00+00:00',
  timezone: 'Europe/Dublin',
  venue: { name: 'The Sound House', city: 'Dublin', country: 'Ireland' },
  stages: [{ artists: [{ name: 'Kobot' }, { name: 'Middle-D' }] }],
  cardArtists: ['Kobot', 'Middle-D'],
  images: { bannerLocal: '/events/banners/tropical-groove-2026-11-20.jpg' },
  links: {
    eventbrite: 'https://tickets.example/eventbrite',
    tickets: 'https://tickets.example/direct',
    goabase: 'https://www.goabase.net/party/example',
  },
};

describe('public upcoming list', () => {
  it('sorts by dateStart ascending', () => {
    const later = { ...fixture, id: 'later', dateStart: '2026-12-01T19:00:00Z' };
    const sooner = { ...fixture, id: 'sooner', dateStart: '2026-11-20T19:00:00Z' };
    const original = [later, sooner];
    assert.deepEqual(
      sortByDateAsc(original).map((event) => event.id),
      ['sooner', 'later'],
    );
    assert.equal(original[0]?.id, 'later');
  });

  it('prefers Eventbrite, then tickets, then Goabase', () => {
    assert.equal(getPrimaryTicketUrl(fixture.links), 'https://tickets.example/eventbrite');
    assert.equal(getPrimaryTicketUrl({ tickets: fixture.links.tickets, goabase: fixture.links.goabase }), 'https://tickets.example/direct');
    assert.equal(getPrimaryTicketUrl({ goabase: fixture.links.goabase }), 'https://www.goabase.net/party/example');
    assert.equal(
      getPrimaryTicketUrl({ eventbrite: 'javascript:alert(1)', tickets: fixture.links.tickets }),
      'https://tickets.example/direct',
    );
  });

  it('has no ticket sales when only Goabase is set', () => {
    assert.equal(hasTicketSales({ goabase: fixture.links.goabase }), false);
    assert.equal(hasTicketSales(fixture.links), true);
    assert.equal(hasTicketSales({ eventbrite: 'javascript:alert(1)' }), false);
    assert.equal(getEventTimetableUrl('forest-2026'), 'https://timetable.tropical-nomads.com/?festival=forest-2026');
    assert.equal(getEventTimetableUrl('https://evil.example'), undefined);
    assert.equal(getStageSummary(fixture), 'Kobot · Middle-D');
  });

  it('formats a date when the timezone is a city name', () => {
    const when = { dateStart: '2026-11-20T19:00:00Z', dateEnd: '2026-11-21T02:00:00Z' };
    assert.equal(knownTimeZone('Europe/Dublin'), 'Europe/Dublin');
    assert.equal(knownTimeZone('Dublin'), undefined);
    assert.equal(formatEventDate({ ...when, timezone: 'Dublin' }, 'en'), formatEventDate(when, 'en'));
    assert.equal(spansMultipleEventDays({ ...when, timezone: 'Dublin' }), spansMultipleEventDays(when));
  });
});
