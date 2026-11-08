import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import type { InferRequestType, InferResponseType } from 'hono';
import { hc } from 'hono/client';
import { api, type ApiApp } from '../src/app.ts';
import { assertNoPrivateFields, isUpcomingEvent, readEvents } from '../src/published.ts';
import { schemas } from '../src/schemas.ts';
import { listen } from '../src/server.ts';

const client = hc<ApiApp>('http://127.0.0.1');
type EventsBody = InferResponseType<(typeof client.events)['$get'], 200>;
type UpcomingBody = InferResponseType<(typeof client.events.upcoming)['$get'], 200>;
type UpcomingInput = InferRequestType<(typeof client.events.upcoming)['$get']>;

function eventProvider(body: EventsBody): string {
  return body.source.provider;
}

function firstGoabase(body: EventsBody): string | undefined {
  return body.events[0]?.links?.goabase;
}

function upcomingToday(input: UpcomingInput): string | undefined {
  return input.query.today;
}

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
    const first = events.events[0];
    assert.ok(first);
    assert.equal(typeof first.links?.goabase, 'string');
    assert.equal(first.source?.provider, 'goabase');
    assert.equal(JSON.stringify(events).includes('"secret"'), false);
    assert.equal((schemas.party as readonly string[]).includes('secret'), false);
    assert.throws(() => assertNoPrivateFields({ id: 'party-1', secret: 'ticket-secret' }));
  });

  it('serves the stored events and refuses private routes', async () => {
    const stored = await api.request('/events');
    assert.equal(stored.status, 200);
    assert.equal(stored.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(stored.headers.get('cache-control'), 'no-store');
    assert.equal(stored.headers.get('strict-transport-security'), null);
    assert.equal(stored.headers.get('access-control-allow-origin'), null);
    const body = (await stored.json()) as EventsBody;
    assert.equal(eventProvider(body), 'goabase');
    assert.equal(typeof firstGoabase(body), 'string');
    assert.equal(body.events.length, readEvents().events.length);
    assert.equal(upcomingToday({ query: { today: '2020-01-01' } }), '2020-01-01');

    const allUpcoming = await api.request('/events/upcoming?today=2020-01-01');
    assert.equal(((await allUpcoming.json()) as UpcomingBody).events.length, readEvents().events.length);

    const upcoming = await api.request('/events/upcoming?today=2030-01-01');
    assert.equal(upcoming.status, 200);
    const upcomingBody = (await upcoming.json()) as UpcomingBody;
    assert.equal(upcomingBody.events.length, 0);
    assert.equal(upcomingBody.source.provider, 'goabase');

    const past = await api.request('/events/past?today=2020-01-01');
    assert.equal(past.status, 200);
    assert.equal(((await past.json()) as { events: unknown[] }).events.length, 0);

    const head = await api.request('/events', { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
    assert.equal(head.headers.get('content-type'), 'application/json; charset=utf-8');
    assert.equal(head.headers.get('x-content-type-options'), 'nosniff');

    const ignoredToday = await api.request('/events?today=2020-01-01');
    assert.equal(ignoredToday.status, 200);
    const partners = await api.request('/partners');
    const partnerBody = (await partners.json()) as { partners: { logo?: string }[] };
    assert.equal(typeof partnerBody.partners[0]?.logo, 'string');

    const denied = await api.request('/events', { method: 'POST' });
    assert.equal(denied.status, 405);
    assert.deepEqual(await denied.json(), { error: 'method not allowed' });
    const missing = await api.request('/tickets');
    assert.equal(missing.status, 404);
    assert.deepEqual(await missing.json(), { error: 'not found' });
    const headMissing = await api.request('/tickets', { method: 'HEAD' });
    assert.equal(headMissing.status, 404);
    assert.equal(await headMissing.text(), '');
    assert.equal((await api.request('/orders')).status, 404);
    assert.equal((await api.request('/payments')).status, 404);
    assert.equal((await api.request('/stock')).status, 404);
    assert.equal((await api.request('/events/../package.json')).status, 404);
    assert.equal((await api.request('/events?limit=1')).status, 400);
    assert.equal((await api.request('/events/upcoming?today=2020-01-01&today=2020-01-02')).status, 400);
    assert.equal((await api.request('/events/upcoming?today=2020-13-40')).status, 400);
    assert.equal((await api.request('/artists')).status, 200);
  });

  it('answers a client on the loopback address', async () => {
    const server = await listen(8791);
    try {
      const response = await fetch('http://127.0.0.1:8791/events');
      assert.equal(response.status, 200);
      const body = (await response.json()) as EventsBody;
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
