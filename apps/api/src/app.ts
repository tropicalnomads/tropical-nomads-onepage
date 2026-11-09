import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { validator } from 'hono/validator';
import { readArtistCatalog, readPartyCatalog } from './catalog.ts';
import { apiHealth } from './health.ts';
import { eventsView, pastEvents, publishedSchema, readCatalog, upcomingEvents, type PublishedCatalog } from './published.ts';

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

const routes = new Hono()
  .get('/health', (c) => {
    if (new URL(c.req.url).search !== '') {
      return c.json({ error: 'unknown query' } satisfies ApiError, 400);
    }
    return c.json(apiHealth());
  })
  .get('/events', todayQuery, (c) => c.json(readPartyCatalog()))
  .get('/events/upcoming', todayQuery, (c) => {
    const events = readPartyCatalog();
    return c.json(eventsView(events, upcomingEvents(events.events, selectedDay(c.req.valid('query').today))));
  })
  .get('/events/past', todayQuery, (c) => {
    const events = readPartyCatalog();
    return c.json(eventsView(events, pastEvents(events.events, selectedDay(c.req.valid('query').today))));
  })
  .get('/artists', todayQuery, (c) => c.json(readArtistCatalog()))
  .get('/venues', todayQuery, (c) => c.json(catalogResponse('venues')))
  .get('/labels', todayQuery, (c) => c.json(catalogResponse('labels')))
  .get('/partners', todayQuery, (c) => c.json(catalogResponse('partners')))
  .get('/socials', todayQuery, (c) => c.json(catalogResponse('socials')))
  .get('/agencies', todayQuery, (c) => c.json(catalogResponse('agencies')))
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
    if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
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
