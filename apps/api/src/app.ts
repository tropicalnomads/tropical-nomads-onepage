import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { validator } from 'hono/validator';
import { artistsFrom, readArtistCatalog, readPartyCatalog, serveStoredRecords } from './catalog.ts';
import { databaseSettings } from './database.ts';
import { apiHealth } from './health.ts';
import { handlePrivate } from './private-api.ts';
import { loadProductCatalog } from './products.ts';
import { assertNoPrivateFields, eventsView, pastEvents, publishedEventsFrom, publishedSchema, readCatalog, upcomingEvents, type PublishedCatalog } from './published.ts';
import { readStoredCatalog, type StoredCatalog } from './sql-store.ts';

export interface TodayQuery {
  today?: string;
}

export interface ApiError {
  error: string;
}

export function parseToday(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('today must be YYYY-MM-DD');
  }
  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const today = new Date(year, month - 1, day);
  if (today.getFullYear() !== year || today.getMonth() !== month - 1 || today.getDate() !== day) {
    throw new Error('today must be YYYY-MM-DD');
  }
  return today;
}

function startOfToday(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

const todayQuery = validator('query', (query: TodayQuery, c): { today?: string } | Response => {
  const rawQuery = query as Record<string, unknown>;
  for (const key of Object.keys(rawQuery)) {
    if (key !== 'today') {
      return c.json({ error: 'unknown query' } satisfies ApiError, 400);
    }
  }
  const raw = rawQuery.today;
  if (typeof raw === 'string' && raw !== '') {
    try {
      parseToday(raw);
      return { today: raw };
    } catch {
      return c.json({ error: 'today must be YYYY-MM-DD' } satisfies ApiError, 400);
    }
  }
  if (raw === undefined) {
    return { today: undefined };
  }
  return c.json({ error: 'today must be YYYY-MM-DD' } satisfies ApiError, 400);
});

function requireSchema(catalog: PublishedCatalog): void {
  if (publishedSchema(catalog).length === 0) {
    throw new Error('catalog schema is empty');
  }
}

function selectedDay(today: string | undefined): Date {
  return today === undefined ? startOfToday() : parseToday(today);
}

function catalogResponse(catalog: PublishedCatalog): Record<string, unknown> | unknown[] {
  requireSchema(catalog);
  const body = readCatalog(catalog);
  if (typeof body !== 'object' || body === null) {
    throw new Error('catalog is not a json object');
  }
  return body;
}

async function storedCatalog(catalog: PublishedCatalog): Promise<unknown> {
  requireSchema(catalog);
  if (!databaseSettings()) {
    if (catalog === 'events') {
      return readPartyCatalog();
    }
    if (catalog === 'artists') {
      return readArtistCatalog();
    }
    return catalogResponse(catalog);
  }
  const stored = await readStoredCatalog(catalog satisfies StoredCatalog);
  assertNoPrivateFields(stored);
  if (catalog === 'events') {
    const events = publishedEventsFrom(stored);
    return eventsView(events, serveStoredRecords(events.events));
  }
  if (catalog === 'artists') {
    return artistsFrom(stored);
  }
  return stored;
}

const routes = new Hono()
  .get('/health', (c) => {
    if (new URL(c.req.url).search !== '') {
      return c.json({ error: 'unknown query' } satisfies ApiError, 400);
    }
    return c.json(apiHealth());
  })
  .get('/events', todayQuery, async (c) => c.json(publishedEventsFrom(await storedCatalog('events'))))
  .get('/events/upcoming', todayQuery, async (c) => {
    const events = publishedEventsFrom(await storedCatalog('events'));
    return c.json(eventsView(events, upcomingEvents(events.events, selectedDay(c.req.valid('query').today))));
  })
  .get('/events/past', todayQuery, async (c) => {
    const events = publishedEventsFrom(await storedCatalog('events'));
    return c.json(eventsView(events, pastEvents(events.events, selectedDay(c.req.valid('query').today))));
  })
  .get('/artists', todayQuery, async (c) => c.json(await storedCatalog('artists')))
  .get('/venues', todayQuery, async (c) => c.json(await storedCatalog('venues')))
  .get('/labels', todayQuery, async (c) => c.json(await storedCatalog('labels')))
  .get('/partners', todayQuery, async (c) => c.json(await storedCatalog('partners')))
  .get('/socials', todayQuery, async (c) => c.json(await storedCatalog('socials')))
  .get('/agencies', todayQuery, async (c) => c.json(await storedCatalog('agencies')))
  .get('/products', todayQuery, async (c) => c.json({ products: await loadProductCatalog() }))
  .post('/private', async (c) => {
    if (new URL(c.req.url).search !== '') {
      return c.json({ error: 'unknown query' } satisfies ApiError, 400);
    }
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      body = undefined;
    }
    const result = await handlePrivate(body, c.req.header('cookie'));
    return c.json(result.body, result.status);
  })
  .notFound((c) => c.json({ error: 'not found' } satisfies ApiError, 404))
  .onError((_error, c) => c.json({ error: 'catalog unavailable' } satisfies ApiError, 500));

export const api = new Hono()
  .use(
    '*',
    secureHeaders({
      strictTransportSecurity: false,
      contentSecurityPolicy: {
        defaultSrc: ["'none'"],
        baseUri: ["'none'"],
        frameAncestors: ["'none'"],
      },
      crossOriginResourcePolicy: 'same-origin',
      referrerPolicy: 'no-referrer',
      xFrameOptions: 'DENY',
    }),
  )
  .use('*', async (c, next) => {
    await next();
    c.header('Content-Type', 'application/json; charset=utf-8');
    c.header('Cache-Control', 'no-store');
  })
  .use('*', async (c, next) => {
    const pathname = new URL(c.req.url).pathname;
    if (c.req.method !== 'GET' && c.req.method !== 'HEAD' && !(c.req.method === 'POST' && pathname === '/private')) {
      return c.json({ error: 'method not allowed' } satisfies ApiError, 405);
    }
    if (c.req.method === 'HEAD') {
      const url = new URL(c.req.url);
      const response = await routes.request(`${url.pathname}${url.search}`, { method: 'GET' });
      const headers = new Headers(response.headers);
      headers.delete('content-length');
      return new Response(null, { status: response.status, headers });
    }
    return next();
  })
  .route('/', routes)
  .notFound((c) => c.json({ error: 'not found' } satisfies ApiError, 404))
  .onError((_error, c) => c.json({ error: 'catalog unavailable' } satisfies ApiError, 500));

export type ApiApp = typeof api;
