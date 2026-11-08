import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { handleApiRequest, listen } from '../src/http.ts';
import { assertNoPrivateFields, isUpcomingEvent, readEvents } from '../src/published.ts';
import { schemas } from '../src/schemas.ts';

describe('published events', () => {
  it('matches the one-pager upcoming rule for a fixed today', () => {
    const today = new Date(2026, 9, 24);
    const startsToday = new Date(2026, 9, 24, 19, 0, 0, 0).toISOString();
    const endedYesterday = new Date(2026, 9, 23, 19, 0, 0, 0).toISOString();
    assert.equal(isUpcomingEvent({ dateStart: startsToday }, today), true);
    assert.equal(isUpcomingEvent({ dateStart: endedYesterday }, today), false);
  });

  it('returns the published events envelope, including the provider and no ticket secret', () => {
    const events = readEvents();
    assert.equal(events.source.provider, 'goabase');
    const first = events.events[0] as { links?: { goabase?: string }; source?: { provider?: string } };
    assert.equal(typeof first?.links?.goabase, 'string');
    assert.equal(first?.source?.provider, 'goabase');
    assert.equal(JSON.stringify(events).includes('"secret"'), false);
    assert.equal((schemas.party as readonly string[]).includes('secret'), false);
    assert.throws(() => assertNoPrivateFields({ id: 'party-1', secret: 'ticket-secret' }));
  });

  it('serves the stored events and refuses private routes', () => {
    const stored = handleApiRequest('GET', '/events');
    assert.equal(stored.status, 200);
    const body = stored.body as { source: { provider: string }; events: unknown[] };
    assert.equal(body.source.provider, 'goabase');
    assert.equal(body.events.length, readEvents().events.length);

    const allUpcoming = handleApiRequest('GET', '/events/upcoming?today=2020-01-01');
    assert.equal((allUpcoming.body as { events: unknown[] }).events.length, readEvents().events.length);

    const upcoming = handleApiRequest('GET', '/events/upcoming?today=2030-01-01');
    assert.equal(upcoming.status, 200);
    assert.equal((upcoming.body as { events: unknown[]; source: { provider: string } }).events.length, 0);
    assert.equal((upcoming.body as { source: { provider: string } }).source.provider, 'goabase');

    const past = handleApiRequest('GET', '/events/past?today=2020-01-01');
    assert.equal(past.status, 200);
    assert.equal((past.body as { events: unknown[] }).events.length, 0);

    assert.equal(handleApiRequest('POST', '/events').status, 405);
    assert.equal(handleApiRequest('GET', '/tickets').status, 404);
    assert.equal(handleApiRequest('GET', '/orders').status, 404);
    assert.equal(handleApiRequest('GET', '/payments').status, 404);
    assert.equal(handleApiRequest('GET', '/stock').status, 404);
    assert.equal(handleApiRequest('GET', '/events/../package.json').status, 404);
  });

  it('answers a client on the loopback address', async () => {
    const server = await listen(8791);
    try {
      const response = await fetch('http://127.0.0.1:8791/events');
      assert.equal(response.status, 200);
      const body = (await response.json()) as { source: { provider: string } };
      assert.equal(body.source.provider, 'goabase');
      const address = server.address();
      assert.equal(address !== null && typeof address === 'object' && address.address, '127.0.0.1');
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it('leaves the one-pager fetch and the www build on the one-pager', () => {
    const data = readFileSync(new URL('../../one-pager/src/lib/data.ts', import.meta.url), 'utf8');
    const amplify = readFileSync(new URL('../../../amplify.yml', import.meta.url), 'utf8');
    assert.match(data, /\/data\/events\.json/);
    assert.match(amplify, /tropical-nomads-page/);
    assert.equal(amplify.includes('tropical-nomads-api'), false);
  });
});
