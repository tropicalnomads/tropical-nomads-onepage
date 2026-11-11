import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { eventArtists, eventDayKeys, eventHeadliners, filterCalendarEvents, monthMatrix, type CalendarEventFields } from '../src/events/calendar.ts';

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

  it('sorts the complete lineup alphabetically', () => {
    const lineup = ['Technology', 'ARAM', 'Dirty Saffi', 'Bocara', 'Psymmetrix', 'Cyk', 'Elowinz', 'FNX', 'Deutsch'];
    assert.deepEqual(
      eventArtists({ ...events[0]!, cardArtists: lineup }),
      ['ARAM', 'Bocara', 'Cyk', 'Deutsch', 'Dirty Saffi', 'Elowinz', 'FNX', 'Psymmetrix', 'Technology'],
    );
  });

  it('identifies Technology and ARAM as title headliners for both event brands', () => {
    const cardArtists = ['Psymmetrix', 'Technology', 'Deutsch', 'Jungle Rumble', 'Dirty Saffi', 'ARAM'];
    assert.deepEqual(
      eventHeadliners({ ...events[0]!, id: '118006', title: 'Tropical Nomads presents: Technology & ARAM', cardArtists }),
      ['ARAM', 'Deutsch', 'Jungle Rumble', 'Technology'],
    );
    assert.deepEqual(
      eventHeadliners({ ...events[0]!, title: 'Tropical Groove presents: Technology & ARAM', cardArtists }),
      ['ARAM', 'Technology'],
    );
  });

  it('uses the curated Bom Shanka Label Night headliners', () => {
    assert.deepEqual(
      eventHeadliners({
        ...events[0]!,
        id: '116643',
        title: 'Bom Shanka Label Night',
        cardArtists: ['Psymmetrix', 'Bocara', 'Dirty Saffi', 'Illegal Machines'],
      }),
      ['Bocara', 'Dirty Saffi', 'Psymmetrix'],
    );
  });

  it('uses the curated Forest Shankara headliners', () => {
    assert.deepEqual(
      eventHeadliners({
        ...events[1]!,
        id: 'forest-shankara-sacred-pulse-2026',
        cardArtists: [
          'Elowinz',
          'Dezzert',
          'Bocara',
          'Cyk',
          'FNX',
          'Alien Coffee',
          'Inside Mind',
          'Sabedoria',
          'Psychological',
          'Total Illusion',
          'Sartor',
        ],
      }),
      [
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
    );
  });

  it('uses Adrenaline Rush as the Pre-St Patrick’s Day headliner', () => {
    assert.deepEqual(
      eventHeadliners({
        ...events[0]!,
        id: '116906',
        title: 'Tropical Groove: Pre-St Patrick` s Day',
        cardArtists: ['Shivaion in Dub', 'Adrenaline Rush', 'Dolce Vita'],
      }),
      ['Adrenaline Rush'],
    );
  });

  it('uses the curated Pre-Halloween Party headliners', () => {
    assert.deepEqual(
      eventHeadliners({
        ...events[0]!,
        id: '115995',
        title: 'Tropical Groove: Pre-Halloween Party',
        cardArtists: ['Shivaion', 'After June', "Blazin'G", 'Romanetto'],
      }),
      ['After June', "Blazin'G", 'Shivaion'],
    );
  });

  it('uses Alien Noise and Atohmic as the Psychedelic Warmup headliners', () => {
    assert.deepEqual(
      eventHeadliners({
        ...events[0]!,
        id: '115553',
        title: 'Psychedelic Warmup',
        cardArtists: ['After June', 'Alien Noise', 'Atohmic'],
      }),
      ['Alien Noise', 'Atohmic'],
    );
  });

  it('uses the curated Spring Awakening headliners', () => {
    assert.deepEqual(
      eventHeadliners({
        ...events[0]!,
        id: '117257',
        title: 'Tropical Groove: Spring Awakening',
        cardArtists: ['Texo', 'Candelas', 'Cosmic Brothers Project', 'Shivaion'],
      }),
      ['Candelas', 'Cosmic Brothers Project', 'Texo'],
    );
  });

  it('uses the curated Burn in Noise headliners', () => {
    assert.deepEqual(
      eventHeadliners({
        ...events[0]!,
        id: '117152',
        title: 'Tropical Nomads: Burn in Noise',
        cardArtists: ['Burn in Noise', 'After June', "Blazin'G"],
      }),
      ['Burn in Noise'],
    );
    assert.deepEqual(
      eventHeadliners({
        ...events[0]!,
        id: '117120',
        title: 'Tropical Groove: Burn in Noise',
        cardArtists: ['Burn in Noise', 'Altered State', 'After June'],
      }),
      ['Altered State', 'Burn in Noise'],
    );
  });

  it('uses the curated Avan7 headliners in Amsterdam and Dublin', () => {
    assert.deepEqual(
      eventHeadliners({
        ...events[0]!,
        id: '117712',
        title: 'Tropical Nomads: Avan7',
        cardArtists: ['Avan7', 'Back to Mars', 'Brain Damage', 'Psychological', 'Yesca'],
      }),
      ['Avan7', 'Back to Mars', 'Brain Damage', 'Psychological', 'Yesca'],
    );
    assert.deepEqual(
      eventHeadliners({
        ...events[0]!,
        id: '117713',
        title: 'Tropical Groove: Avan7',
        cardArtists: ['Avan7', 'Brain Damage', 'Frostbite', 'Psychological'],
      }),
      ['Avan7', 'Brain Damage', 'Frostbite', 'Psychological'],
    );
  });

  it('uses the curated Pre-Halloween 2nd Edition headliners', () => {
    assert.deepEqual(
      eventHeadliners({
        ...events[0]!,
        id: '118352',
        title: 'Tropical Groove: Pre-Halloween 2nd Edition with FNX',
        cardArtists: ['FNX', 'Valkyrie', '3rd Vision', 'After June'],
      }),
      ['3rd Vision', 'FNX', 'Valkyrie'],
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
