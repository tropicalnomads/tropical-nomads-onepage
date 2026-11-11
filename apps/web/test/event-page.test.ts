import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { loadHomeCatalog } from '../src/home/catalog.ts';
import { loadPublicEvent } from '../src/events/load.ts';

describe('public event pages', () => {
  it('loads a published event by id with its detail content', async () => {
    const expected = loadHomeCatalog().events[0];
    assert.ok(expected);
    const event = await loadPublicEvent(expected.id);
    assert.equal(event?.id, expected.id);
    assert.equal(event?.title, expected.title);
    assert.equal(event?.city, expected.city);
  });

  it('links calendar and home events to the canonical event route', () => {
    const calendar = readFileSync(new URL('../src/components/UpcomingEvents.tsx', import.meta.url), 'utf8');
    const upcoming = readFileSync(new URL('../src/components/home/UpcomingSection.tsx', import.meta.url), 'utf8');
    const past = readFileSync(new URL('../src/components/home/PastSection.tsx', import.meta.url), 'utf8');
    const page = readFileSync(new URL('../app/events/[id]/page.tsx', import.meta.url), 'utf8');
    const calendarPage = readFileSync(new URL('../app/upcoming-events/page.tsx', import.meta.url), 'utf8');
    assert.equal(calendar.includes('href={`/events/${encodeURIComponent(event.id)}`}'), true);
    assert.equal(upcoming.includes('href={`/events/${encodeURIComponent(event.id)}`}'), true);
    assert.equal(past.includes('href={`/events/${encodeURIComponent(event.id)}`}'), true);
    assert.equal(page.includes('loadPublicEvent(id)'), true);
    assert.equal(page.includes('notFound()'), true);
    assert.equal(calendar.includes('href={`/artists/${encodeURIComponent('), true);
    assert.equal(calendarPage.includes('loadArtistProfiles()'), true);
  });
});
