import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { locales, type Locale } from 'tropical-nomads-shared';
import { withBookingsArtists } from '../src/artists/bookings.ts';
import { artistEventHistory } from '../src/artists/events.ts';
import { artistProfilesFrom, localizedArtistBio, type ArtistEventCard } from '../src/artists/profile.ts';
import { artistRequestMailto } from '../src/artists/request.ts';
import { artistCopy, artistText, fillArtist, type ArtistCopyKey } from '../src/i18n/artist-copy.ts';

const now = new Date('2026-06-01T00:00:00.000Z');

const events = {
  events: [
    {
      id: 'stage-only',
      title: 'Forest Night',
      dateStart: '2026-07-01T20:00:00.000Z',
      cardArtists: ['Other'],
      stages: [
        { name: 'Forest', artists: [{ name: 'Deutsch' }] },
        { name: 'Main', artists: [{ name: 'DEUTSCH' }] },
        { name: 'main', artists: [{ name: 'Deutsch' }] },
      ],
      venue: { name: 'Warehouse', city: 'Lisbon', country: 'Portugal', mapUrl: 'http://maps.example/lisbon' },
      images: { full: '/events/media/stage-only' },
      links: { goabase: 'https://goabase.example/stage-only' },
    },
    {
      id: 'both',
      title: 'Both Rooms',
      dateStart: '2026-08-01T20:00:00.000Z',
      dateEnd: '2026-08-02T04:00:00.000Z',
      timezone: 'Europe/Dublin',
      durationHours: 8,
      cardArtists: ['deutsch'],
      headliners: ['Deutsch'],
      stages: [{ name: 'Main', artists: [{ name: 'Deutsch' }] }],
      venue: { city: 'Dublin', country: 'Ireland', mapUrl: 'https://maps.example/dublin' },
      images: { full: 'https://cdn.example/both.jpg' },
      links: { eventbrite: 'http://insecure.example/both', tickets: 'https://tickets.example/both' },
    },
    {
      id: 'both',
      title: 'Duplicate id',
      dateStart: '2026-09-01T20:00:00.000Z',
      cardArtists: ['Deutsch'],
    },
    {
      id: 'past-card',
      title: 'Past Card',
      dateStart: '2026-01-02T20:00:00.000Z',
      stages: [{ name: 'Room', artists: ['Deutsch'] }],
      links: { eventbrite: 'javascript:alert(1)', tickets: 'https://tickets.example/past' },
    },
    {
      id: 'past-earlier',
      title: 'Earlier',
      dateStart: '2025-12-01T20:00:00.000Z',
      cardArtists: ['  Deutsch  '],
      images: { full: 'http://cdn.example/earlier.jpg' },
    },
    {
      id: 'starts-now',
      title: 'Starts Now',
      dateStart: '2026-06-01T00:00:00.000Z',
      cardArtists: ['Deutsch'],
    },
    {
      id: 'prefix',
      title: 'Prefix',
      dateStart: '2026-07-15T20:00:00.000Z',
      cardArtists: ['Deutschland'],
    },
    {
      id: 'raw-only',
      title: 'Raw lineup',
      dateStart: '2026-07-20T20:00:00.000Z',
      lineupRaw: 'Deutsch',
      description: 'Deutsch plays tonight.',
    },
    {
      id: 'broken',
      title: 'Broken',
      dateStart: 'not-a-date',
      cardArtists: ['Deutsch'],
    },
  ],
};

function historyCard(id: string): ArtistEventCard {
  const history = artistEventHistory(events, 'Deutsch', now);
  const found = [...history.upcoming, ...history.past].find((item) => item.id === id);
  if (!found) {
    assert.fail(`missing ${id}`);
  }
  return found;
}

describe('artist event history', () => {
  it('includes a stage-only billing and ignores prefixes and free text', () => {
    const history = artistEventHistory(events, 'Deutsch', now);
    const ids = [...history.upcoming, ...history.past].map((item) => item.id);
    assert.equal(ids.includes('stage-only'), true);
    assert.equal(ids.includes('prefix'), false);
    assert.equal(ids.includes('raw-only'), false);
    assert.equal(ids.includes('broken'), false);
    assert.deepEqual(historyCard('stage-only').stageNames, ['Forest', 'Main']);
    assert.equal(historyCard('past-card').stageNames[0], 'Room');
  });

  it('keeps one card when the artist is on the card and the stage, or the id repeats', () => {
    const history = artistEventHistory(events, 'Deutsch', now);
    const ids = [...history.upcoming, ...history.past].map((item) => item.id);
    assert.equal(ids.filter((id) => id === 'both').length, 1);
    assert.equal(historyCard('both').title, 'Both Rooms');
    assert.equal(new Set(ids).size, ids.length);
  });

  it('sorts upcoming events forward and past events backward', () => {
    const history = artistEventHistory(events, 'Deutsch', now);
    assert.deepEqual(
      history.upcoming.map((item) => item.id),
      ['starts-now', 'stage-only', 'both'],
    );
    assert.deepEqual(
      history.past.map((item) => item.id),
      ['past-card', 'past-earlier'],
    );
  });

  it('keeps the event identity, date, place, and flyer, and only the metadata that was published', () => {
    const stageOnly = historyCard('stage-only');
    assert.equal(stageOnly.id, 'stage-only');
    assert.equal(stageOnly.title, 'Forest Night');
    assert.equal(stageOnly.date, '2026-07-01T20:00:00.000Z');
    assert.equal(stageOnly.when, stageOnly.date);
    assert.equal(stageOnly.place, 'Warehouse, Lisbon');
    assert.equal(stageOnly.venue, 'Warehouse');
    assert.equal(stageOnly.city, 'Lisbon');
    assert.equal(stageOnly.country, 'Portugal');
    assert.equal(stageOnly.flyer, '/events/media/stage-only');
    assert.equal(stageOnly.href, '/events/stage-only');
    assert.equal(stageOnly.mapUrl, undefined);
    assert.equal(stageOnly.ticketUrl, undefined);
    assert.equal(stageOnly.headliner, undefined);

    const both = historyCard('both');
    assert.equal(both.place, 'Dublin');
    assert.equal(both.dateEnd, '2026-08-02T04:00:00.000Z');
    assert.equal(both.timezone, 'Europe/Dublin');
    assert.equal(both.durationHours, 8);
    assert.equal(both.mapUrl, 'https://maps.example/dublin');
    assert.equal(both.ticketUrl, 'https://tickets.example/both');
    assert.equal(both.flyer, 'https://cdn.example/both.jpg');
    assert.equal(both.headliner, true);
    assert.equal(both.href, '/events/both');

    const past = historyCard('past-card');
    assert.equal(past.ticketUrl, 'https://tickets.example/past');
    assert.equal(historyCard('past-earlier').flyer, undefined);
    assert.equal(historyCard('starts-now').upcoming, true);
  });
});

describe('artist request mailto', () => {
  it('encodes the artist name and request type for the bookings mailbox', () => {
    const booking = artistRequestMailto('Deutsch', 'booking');
    assert.equal(
      booking,
      'mailto:bookings@tropical-nomads.com?subject=Booking%20request%3A%20Deutsch&body=Hello%2C%0A%0AI%20would%20like%20to%20book%20Deutsch.%0A',
    );

    const pressKit = artistRequestMailto('A & B\nBcc: evil@example.com', 'press-kit');
    if (pressKit === undefined) {
      assert.fail('press kit mailto missing');
    }
    assert.equal(pressKit.includes('\n'), false);
    assert.equal(pressKit.includes('\r'), false);
    assert.equal(pressKit.includes('bcc='), false);
    assert.equal(pressKit.startsWith('mailto:bookings@tropical-nomads.com?'), true);
    assert.equal(pressKit.includes('A%20%26%20B'), true);
    assert.equal(pressKit.includes('Press%20kit%20request'), true);
    const parsed = new URL(pressKit);
    assert.equal(parsed.searchParams.get('subject'), 'Press kit request: A & B Bcc: evil@example.com');
    assert.equal(parsed.searchParams.get('body')?.includes('\n'), true);

    assert.equal(artistRequestMailto('   ', 'booking'), undefined);
    assert.equal(artistRequestMailto('\n\t', 'press-kit'), undefined);
  });
});

describe('artist copy', () => {
  it('keeps every English label in Portuguese', () => {
    assert.deepEqual(Object.keys(artistCopy).sort(), [...locales].sort());
    assert.deepEqual(Object.keys(artistCopy.en).sort(), Object.keys(artistCopy.pt).sort());
    for (const language of locales) {
      for (const [key, value] of Object.entries(artistCopy[language])) {
        assert.equal(typeof value, 'string', key);
        assert.notEqual(value.trim(), '', `${language} ${key}`);
        assert.equal(artistText(language, key as ArtistCopyKey), value);
      }
    }
    const labels: ArtistCopyKey[] = [
      'backToCalendar',
      'profileEyebrow',
      'representedBy',
      'appearances',
      'upcomingCount',
      'about',
      'pressKitOnRequest',
      'requestPressKit',
      'bookArtist',
      'eventHistory',
      'venueFallback',
      'viewEvent',
    ];
    for (const key of labels) {
      assert.notEqual(artistCopy.en[key], artistCopy.pt[key], key);
    }
    assert.equal(artistCopy.en.upcomingCount.includes('{count}'), true);
    assert.equal(artistCopy.pt.upcomingCount.includes('{count}'), true);
    assert.equal(fillArtist('en', 'upcomingCount', { count: '2' }), '2 upcoming');
    assert.equal(fillArtist('pt', 'upcomingCount', { count: '2' }), '2 próximos');
    assert.equal(fillArtist('en', 'flyerAlt', { title: 'Forest Night' }), 'Forest Night flyer');
    const languages = Object.keys(artistCopy) as Locale[];
    assert.deepEqual(languages.sort(), [...locales].sort());
  });
});

describe('artist profile records', () => {
  it('keeps published fields and does not invent a biography, photo, or press kit', () => {
    const profiles = artistProfilesFrom({
      artists: [
        {
          name: 'Deutsch',
          isoCountry: 'BR',
          countryFlag: '🇧🇷',
          genres: ['Progressive', ' '],
          photo: 'https://cdn.example/deutsch.jpg',
          bio: '',
        },
        {
          name: 'After June',
          agencies: ['Tropical Bookings', ' '],
          photo: '/artists/media/after-june',
          bioPt: 'Texto',
        },
        {
          name: 'Wrong Portrait',
          photo: '/artist-portraits/someone-else.png',
        },
      ],
    });
    const deutsch = profiles.find((artist) => artist.id === 'deutsch');
    if (!deutsch) {
      assert.fail('missing deutsch');
    }
    assert.equal(deutsch.name, 'Deutsch');
    assert.equal(deutsch.country, 'BR');
    assert.equal(deutsch.isoCountry, 'BR');
    assert.equal(deutsch.flag, '🇧🇷');
    assert.deepEqual(deutsch.genres, ['Progressive']);
    assert.equal(deutsch.bio, '');
    assert.equal(deutsch.soundcloud, '');
    assert.equal(deutsch.instagram, '');
    assert.equal(deutsch.website, '');
    assert.equal(deutsch.photo, undefined);
    assert.equal(deutsch.agencies, undefined);
    assert.equal('pressKit' in deutsch, false);
    assert.equal('releases' in deutsch, false);

    const afterJune = profiles.find((artist) => artist.name === 'After June');
    assert.deepEqual(afterJune?.agencies, ['Tropical Bookings']);
    assert.equal(afterJune?.photo, '/artists/media/after-june');
    assert.equal(afterJune?.bioPt, 'Texto');
    assert.equal(profiles.find((artist) => artist.name === 'Wrong Portrait')?.photo, undefined);
  });

  it('uses bookings portraits, biographies, and genres for roster artists', () => {
    const profiles = withBookingsArtists(
      artistProfilesFrom({
        artists: [
          { name: 'After June', genres: ['Forest'], instagram: 'https://www.instagram.com/keep-after-june/' },
          { name: 'Deutsch', genres: ['Progressive'] },
          { name: 'Octo' },
          { name: 'Öcto' },
        ],
      }),
    );
    const afterJune = profiles.find((artist) => artist.name === 'After June');
    const deutsch = profiles.find((artist) => artist.name === 'Deutsch');
    const fln = profiles.find((artist) => artist.name === 'FLN');
    if (!afterJune || !deutsch || !fln) {
      assert.fail('missing roster profile');
    }
    assert.deepEqual(afterJune.genres, ['Full-On', 'Twilight', 'Night']);
    assert.equal(afterJune.photo, '/artist-portraits/after-june.png');
    assert.equal(afterJune.bio.includes('Júlio Locatelli Piva'), true);
    assert.equal(afterJune.bioPt?.includes('Júlio Locatelli Piva'), true);
    assert.equal(afterJune.instagram, 'https://www.instagram.com/keep-after-june/');
    assert.equal(afterJune.soundcloud, 'https://soundcloud.com/after-june-music');
    assert.equal(deutsch.bio, '');
    assert.equal(deutsch.photo, undefined);
    assert.deepEqual(deutsch.genres, ['Progressive']);
    assert.equal(fln.photo, '/artist-portraits/fln.png');
    assert.equal(fln.bio.length > 0, true);
    assert.equal(localizedArtistBio(afterJune, 'pt'), afterJune.bioPt);
    assert.equal(localizedArtistBio(deutsch, 'pt'), '');
    assert.equal(profiles.filter((artist) => artist.photo === '/artist-portraits/octo.png').length, 2);
  });
});
