import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { api } from '../src/app.ts';
import {
  operationalCollections,
  operationalWriterLock,
  publishEvents,
  readOperational,
  updateOperational,
  writeOperational,
  type OperationalCollection,
} from '../src/operational.ts';

const privateNames = Object.keys(operationalCollections);

function walk(directory: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      found.push(...walk(path));
    } else {
      found.push(path);
    }
  }
  return found;
}

describe('private operational data', () => {
  it('keeps an empty private collection and refuses a secret on the public events file', () => {
    assert.equal(operationalWriterLock, 'waiting');
    for (const name of privateNames) {
      const file = readOperational(name as OperationalCollection);
      assert.equal(file.schemaVersion, 1);
      assert.deepEqual(file.records, []);
      assert.equal(JSON.stringify(file).includes('secret'), false);
    }

    const events = { schemaVersion: 1, events: [{ id: 'party-1', title: 'Tropical Groove' }] };
    const secret = 'ticket-secret-aaaa';
    const published = publishEvents(events, secret);
    assert.deepEqual(published, events);
    assert.equal(JSON.stringify(published).includes(secret), false);
    assert.throws(() => publishEvents({ ...events, secret }, secret));
    assert.throws(() => publishEvents({ ...events, secret: 'other-value' }, secret));
  });

  it('writes two updates in one process without dropping either, and refuses private fields', async () => {
    const root = mkdtempSync(join(tmpdir(), 'tn-operational-'));
    writeOperational('orders', { schemaVersion: 1, records: [] }, root);
    await Promise.all([
      updateOperational('orders', (current) => ({ ...current, records: [...current.records, { id: 'order-a' }] }), root),
      updateOperational('orders', (current) => ({ ...current, records: [...current.records, { id: 'order-b' }] }), root),
    ]);
    const saved = readOperational('orders', root);
    assert.deepEqual(
      saved.records.map((record) => (record as { id: string }).id).sort(),
      ['order-a', 'order-b'],
    );
    assert.throws(() => writeOperational('orders', { schemaVersion: 1, records: [{ id: 'order-c', secret: 'ticket-secret' }] }, root));
    assert.throws(() =>
      writeOperational('orders', { schemaVersion: 1, records: [{ id: 'order-c', note: '4111111111111111' }] }, root),
    );
    assert.throws(() => writeOperational('../orders' as OperationalCollection, { schemaVersion: 1, records: [] }, root));
    assert.deepEqual(readOperational('orders', root).records.length, 2);
  });

  it('stays out of the one-pager bundle and off the public routes', async () => {
    const amplify = readFileSync(new URL('../../../amplify.yml', import.meta.url), 'utf8');
    const merch = readFileSync(new URL('../../one-pager/src/lib/merch.ts', import.meta.url), 'utf8');
    const apiPackage = readFileSync(new URL('../package.json', import.meta.url), 'utf8');
    assert.match(amplify, /apps\/one-pager\/dist/);
    assert.equal(amplify.includes('data/operational'), false);
    assert.match(merch, /MERCH_STOCK/);
    assert.equal(apiPackage.includes('"pg"'), true);
    assert.equal(apiPackage.includes('prisma'), false);
    assert.equal(apiPackage.includes('password'), false);

    const publicDir = fileURLToPath(new URL('../../one-pager/public', import.meta.url));
    for (const path of walk(publicDir)) {
      assert.equal(path.includes(`${join('data', 'operational')}`), false);
      assert.equal(privateNames.some((name) => path.endsWith(`${name}.json`)), false);
    }

    const distPath = fileURLToPath(new URL('../../one-pager/dist', import.meta.url));
    if (existsSync(distPath)) {
      const built = walk(distPath);
      assert.equal(built.length > 0, true);
      for (const path of built) {
        assert.equal(path.includes(`${join('data', 'operational')}`), false);
        assert.equal(privateNames.some((name) => path.endsWith(`${name}.json`)), false);
      }
    }

    assert.equal((await api.request('/orders')).status, 404);
    assert.equal((await api.request('/payment-traces')).status, 404);
    assert.equal((await api.request('/issued-tickets')).status, 404);
    assert.equal((await api.request('/check-ins')).status, 404);
    assert.equal((await api.request('/door-invites')).status, 404);
    assert.equal((await api.request('/stock-counts')).status, 404);
  });
});
