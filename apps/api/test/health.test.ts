import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { api } from '../src/app.ts';
import { apiHealth } from '../src/health.ts';

describe('api health', () => {
  it('reports that the process is running', () => {
    const startedAt = 1_000;
    assert.deepEqual(apiHealth(6_500, startedAt), {
      status: 'ok',
      service: 'tropical-nomads-api',
      uptimeSeconds: 5,
    });
    assert.equal(apiHealth(startedAt, startedAt).uptimeSeconds, 0);
  });

  it('serves GET and HEAD and refuses anything else', async () => {
    const response = await api.request('/health');
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('access-control-allow-origin'), null);
    const body = (await response.json()) as { status: string; service: string; uptimeSeconds: number };
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'tropical-nomads-api');
    assert.equal(Number.isInteger(body.uptimeSeconds), true);
    assert.equal(JSON.stringify(body).includes('secret'), false);
    assert.equal(JSON.stringify(body).includes('password'), false);

    const head = await api.request('/health', { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');

    const denied = await api.request('/health', { method: 'POST' });
    assert.equal(denied.status, 405);
    const query = await api.request('/health?today=2020-01-01');
    assert.equal(query.status, 400);
    assert.deepEqual(await query.json(), { error: 'unknown query' });
  });
});
