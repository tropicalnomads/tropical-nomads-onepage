import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { cheapestOffer } from '../src/events/offers.ts';
import { loadPublicEvent } from '../src/events/load.ts';
import { loadHomeCatalog, readHomeEvent } from '../src/home/catalog.ts';

describe('public event pages', () => {
  it('loads a published event by id with its detail content', async () => {
    const expected = loadHomeCatalog().events[0];
    assert.ok(expected);
    const event = await loadPublicEvent(expected.id);
    assert.equal(event?.id, expected.id);
    assert.equal(event?.title, expected.title);
    assert.equal(event?.city, expected.city);
    assert.deepEqual(event?.inAppOffers, []);
  });

  it('keeps the cheapest open ticket and the number still on sale', () => {
    const event = readHomeEvent(
      {
        id: 'party-march',
        title: 'Tropical Groove March',
        dateStart: '2027-03-13T19:00:00.000Z',
        venue: { city: 'Dublin', country: 'Ireland' },
        offers: [
          { name: 'Early', amount: 15, currency: 'EUR', capacity: 40 },
          { name: 'Door', amount: 25, currency: 'EUR', capacity: 10 },
          { name: 'Closed', amount: 10, currency: 'EUR', capacity: 2 },
        ],
      },
      { Early: 3, Closed: 2 },
    );
    assert.ok(event);
    assert.deepEqual(
      event.inAppOffers.map((offer) => ({ name: offer.name, amount: offer.amount, remaining: offer.remaining })),
      [
        { name: 'Early', amount: 15, remaining: 37 },
        { name: 'Door', amount: 25, remaining: 10 },
      ],
    );
    assert.equal(cheapestOffer(event.inAppOffers)?.name, 'Early');
    assert.equal(cheapestOffer(event.inAppOffers)?.amount, 15);
    const tickets = readFileSync(new URL('../src/components/home/EventTickets.tsx', import.meta.url), 'utf8');
    const details = readFileSync(new URL('../src/components/home/EventDetails.tsx', import.meta.url), 'utf8');
    assert.equal(tickets.includes('issueTicketAction'), true);
    assert.equal(tickets.includes('type="radio"'), true);
    assert.equal(tickets.includes('inAppNote'), false);
    assert.equal(details.includes('<EventTickets'), true);
    assert.equal(details.includes('lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]'), true);
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
