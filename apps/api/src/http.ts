import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import {
  eventsView,
  pastEvents,
  publishedSchema,
  readCatalog,
  readEvents,
  upcomingEvents,
  type PublishedCatalog,
} from './published.ts';

export interface ApiResult {
  status: number;
  body: unknown;
}

const catalogs: Record<string, PublishedCatalog> = {
  '/artists': 'artists',
  '/venues': 'venues',
  '/labels': 'labels',
  '/partners': 'partners',
  '/socials': 'socials',
  '/agencies': 'agencies',
};

export function parseToday(value: string | null): Date | undefined {
  if (value === null) {
    return undefined;
  }
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

export function handleApiRequest(method: string, requestPath: string, now = new Date()): ApiResult {
  if (method !== 'GET' && method !== 'HEAD') {
    return { status: 405, body: { error: 'method not allowed' } };
  }
  let url: URL;
  try {
    url = new URL(requestPath, 'http://127.0.0.1');
  } catch {
    return { status: 404, body: { error: 'not found' } };
  }
  const unexpectedQuery = [...url.searchParams.keys()].filter((key) => key !== 'today');
  if (unexpectedQuery.length > 0) {
    return { status: 400, body: { error: 'unknown query' } };
  }
  let today: Date;
  try {
    today = parseToday(url.searchParams.get('today')) ?? startOfToday(now);
  } catch {
    return { status: 400, body: { error: 'today must be YYYY-MM-DD' } };
  }

  try {
    if (url.pathname === '/events') {
      return { status: 200, body: readEvents() };
    }
    if (url.pathname === '/events/upcoming') {
      const events = readEvents();
      return { status: 200, body: eventsView(events, upcomingEvents(events.events, today)) };
    }
    if (url.pathname === '/events/past') {
      const events = readEvents();
      return { status: 200, body: eventsView(events, pastEvents(events.events, today)) };
    }
    const catalog = catalogs[url.pathname];
    if (!catalog) {
      return { status: 404, body: { error: 'not found' } };
    }
    publishedSchema(catalog);
    return { status: 200, body: readCatalog(catalog) };
  } catch {
    return { status: 500, body: { error: 'catalog unavailable' } };
  }
}

export function listen(port: number): Promise<ReturnType<typeof createServer>> {
  const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    const result = handleApiRequest(request.method ?? 'GET', request.url ?? '/');
    const body = request.method === 'HEAD' ? '' : JSON.stringify(result.body);
    response.writeHead(result.status, {
      'content-type': 'application/json; charset=utf-8',
      'x-content-type-options': 'nosniff',
      'cache-control': 'no-store',
    });
    response.end(body);
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}
