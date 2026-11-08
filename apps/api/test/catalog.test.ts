import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { api } from '../src/app.ts';
import { serveStoredRecords } from '../src/catalog.ts';
import { schemas } from '../src/schemas.ts';

const repoRoot = new URL('../../../', import.meta.url);
const eventsPath = new URL('../../one-pager/public/data/events.json', import.meta.url);
const artistsPath = new URL('../../one-pager/public/data/artists.json', import.meta.url);

interface StoredParty {
  id: string;
  links?: { goabase?: string; eventbrite?: string; tickets?: string };
}

interface StoredParties {
  count: number;
  events: StoredParty[];
}

interface StoredArtists {
  count: number;
  artists: { name: string; genres?: string[]; agencies?: string[] }[];
}

function findEventsFiles(directory: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') {
      continue;
    }
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      found.push(...findEventsFiles(path));
    } else if (entry.name === 'events.json') {
      found.push(path);
    }
  }
  return found;
}

describe('shared catalog', () => {
  it('serves every published party and does not drop a draft', async () => {
    const stored = JSON.parse(readFileSync(eventsPath, 'utf8')) as StoredParties;
    const response = await api.request('/events');
    assert.equal(response.status, 200);
    const body = (await response.json()) as StoredParties;
    assert.deepEqual(
      body.events.map((party) => party.id),
      stored.events.map((party) => party.id),
    );
    assert.equal(body.events.length, stored.count);
    assert.equal(body.events.some((party) => typeof party.links?.goabase === 'string'), true);
    assert.equal(JSON.stringify(body).includes('"secret"'), false);

    const served = serveStoredRecords([
      { id: 'public-party', draft: false },
      { id: 'draft-party', draft: true },
    ]);
    assert.deepEqual(
      served.map((party) => party.id),
      ['public-party', 'draft-party'],
    );
  });

  it('serves every published artist from the artist schema', async () => {
    const stored = JSON.parse(readFileSync(artistsPath, 'utf8')) as StoredArtists;
    const response = await api.request('/artists');
    assert.equal(response.status, 200);
    const body = (await response.json()) as StoredArtists;
    assert.deepEqual(
      body.artists.map((artist) => artist.name),
      stored.artists.map((artist) => artist.name),
    );
    assert.equal(body.count, stored.count);
    assert.equal(body.artists.some((artist) => Array.isArray(artist.genres) || Array.isArray(artist.agencies)), true);
    assert.equal((schemas.party as readonly string[]).includes('id'), true);
    assert.equal((schemas.artist as readonly string[]).includes('name'), true);
    assert.equal((schemas.artist as readonly string[]).includes('secret'), false);
  });

  it('keeps one events file and does not add an agenda', async () => {
    const files = findEventsFiles(new URL(repoRoot).pathname);
    assert.deepEqual(files, [join(new URL(repoRoot).pathname, 'apps/one-pager/public/data/events.json')]);
    const catalog = readFileSync(new URL('../src/catalog.ts', import.meta.url), 'utf8');
    const refresh = readFileSync(new URL('../../one-pager/scripts/fetch-goabase-events.mjs', import.meta.url), 'utf8');
    const onePager = readFileSync(new URL('../../one-pager/src/lib/data.ts', import.meta.url), 'utf8');
    assert.match(catalog, /schemas\.party/);
    assert.match(catalog, /schemas\.artist/);
    assert.equal(catalog.includes('agenda'), false);
    assert.match(refresh, /events\.json/);
    assert.match(onePager, /\/data\/events\.json/);
    assert.equal((await api.request('/calendar')).status, 404);
    assert.equal((await api.request('/agendas')).status, 404);
    assert.equal((await api.request('/events', { method: 'POST' })).status, 405);
  });
});
