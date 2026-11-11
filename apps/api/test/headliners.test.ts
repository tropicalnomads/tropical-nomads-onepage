import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { parseParty } from 'tropical-nomads-shared';
import { api } from '../src/app.ts';
import { publishedPartyDocument, storedHeadlinersJson } from '../src/sql-store.ts';

const expectedHeadliners = {
  '115553': ['Alien Noise', 'Atohmic'],
  '115995': ['After June', "Blazin'G", 'Shivaion'],
  '116643': ['Bocara', 'Dirty Saffi', 'Psymmetrix'],
  '116906': ['Adrenaline Rush'],
  '117120': ['Altered State', 'Burn in Noise'],
  '117152': ['Burn in Noise'],
  '117257': ['Candelas', 'Cosmic Brothers Project', 'Texo'],
  '117712': ['Avan7', 'Back to Mars', 'Brain Damage', 'Psychological', 'Yesca'],
  '117713': ['Avan7', 'Brain Damage', 'Frostbite', 'Psychological'],
  '118006': ['ARAM', 'Deutsch', 'Jungle Rumble', 'Technology'],
  '118352': ['3rd Vision', 'FNX', 'Valkyrie'],
  'forest-shankara-sacred-pulse-2026': [
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
} as const;

interface StoredEvent {
  id: string;
  headliners?: string[];
  stages?: { artists?: { name?: string }[] }[];
}

describe('persisted event headliners', () => {
  it('round-trips the curated lists through the published events and the party column', async () => {
    const stored = JSON.parse(readFileSync(new URL('../../one-pager/public/data/events.json', import.meta.url), 'utf8')) as {
      events: StoredEvent[];
    };
    const response = await api.request('/events');
    assert.equal(response.status, 200);
    const body = (await response.json()) as { events: StoredEvent[] };
    for (const [id, names] of Object.entries(expectedHeadliners)) {
      const source = stored.events.find((event) => event.id === id);
      const served = body.events.find((event) => event.id === id);
      assert.deepEqual(source?.headliners, names, id);
      assert.deepEqual(served?.headliners, names, id);
    }

    const burn = stored.events.find((event) => event.id === '117152');
    const burnNames = (burn?.stages ?? []).flatMap((stage) => (stage.artists ?? []).map((artist) => artist.name));
    assert.equal(burnNames.includes('Burn in Noise'), true);
    assert.equal(burnNames.includes("Blazin'G"), true);

    const party = {
      id: 'party-1',
      title: 'Tropical Groove',
      dateStart: '2026-12-01',
      venue: { id: 'venue-1' },
      links: { goabase: 'https://www.goabase.net/party/party-1' },
    };
    const parsed = parseParty({ ...party, headliners: ['Burn in Noise'] });
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal(storedHeadlinersJson(parsed.value.headliners), '["Burn in Noise"]');
      assert.deepEqual(publishedPartyDocument({ id: parsed.value.id }, parsed.value.headliners), {
        id: 'party-1',
        headliners: ['Burn in Noise'],
      });
    }
    assert.equal(storedHeadlinersJson([]), '[]');
    assert.equal(storedHeadlinersJson(undefined), null);
    assert.deepEqual(publishedPartyDocument({ id: '117152', headliners: ['kept'] }, null), {
      id: '117152',
      headliners: ['kept'],
    });
    assert.deepEqual(publishedPartyDocument({ id: '117152', headliners: ['kept'] }, []), {
      id: '117152',
      headliners: [],
    });

    const root = dirname(fileURLToPath(import.meta.url));
    const store = readFileSync(join(root, '../src/sql-store.ts'), 'utf8');
    const refresh = readFileSync(join(root, '../../one-pager/scripts/fetch-goabase-events.mjs'), 'utf8');
    assert.match(store, /headliners = excluded\.headliners/);
    assert.match(store, /storedHeadlinersJson\(event\.headliners\)/);
    assert.match(refresh, /lineupOverride\?\.headliners/);
    assert.match(refresh, /keepStoredHeadliners/);
    const calendar = readFileSync(join(root, '../../web/src/events/calendar.ts'), 'utf8');
    assert.equal(calendar.includes('headlinersByEventId'), false);
  });
});
