import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GET } from '../app/health/route.ts';
import { webHealth } from '../src/health.ts';

describe('web health', () => {
  it('reports the web process without calling an API that is not configured', async () => {
    let called = false;
    const report = await webHealth({}, async () => {
      called = true;
      return { ok: true };
    }, 4_000, 1_000);
    assert.equal(called, false);
    assert.deepEqual(report, {
      status: 'ok',
      service: 'tropical-nomads-web',
      uptimeSeconds: 3,
      api: 'not-configured',
      sessionConfigured: false,
    });
    assert.equal((await webHealth({ API_BASE_URL: 'not a url' })).api, 'not-configured');
  });

  it('reports the API health route when it answers, and degraded when it does not', async () => {
    const ready = await webHealth({ API_BASE_URL: 'http://127.0.0.1:8787' }, async (url) => {
      assert.equal(url, 'http://127.0.0.1:8787/health');
      return { ok: true };
    });
    assert.equal(ready.status, 'ok');
    assert.equal(ready.api, 'ok');

    const down = await webHealth({ API_BASE_URL: 'https://api.example.com' }, async () => ({ ok: false }));
    assert.equal(down.status, 'degraded');
    assert.equal(down.api, 'unreachable');
    assert.equal(JSON.stringify(down).includes('api.example.com'), false);

    const failed = await webHealth({ API_BASE_URL: 'https://api.example.com' }, async () => {
      throw new Error('connect ECONNREFUSED 10.0.0.5');
    });
    assert.equal(failed.api, 'unreachable');
    assert.equal(JSON.stringify(failed).includes('10.0.0.5'), false);

    const secret = 's'.repeat(40);
    const configured = await webHealth({ ACCOUNT_SESSION_SECRET: secret });
    assert.equal(configured.sessionConfigured, true);
    assert.equal(JSON.stringify(configured).includes(secret), false);
    const shortSecret = await webHealth({ ACCOUNT_SESSION_SECRET: 'short' });
    assert.equal(shortSecret.sessionConfigured, false);
  });

  it('serves GET /health', async () => {
    const previous = process.env.API_BASE_URL;
    delete process.env.API_BASE_URL;
    try {
      const response = await GET();
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      const body = (await response.json()) as { status: string; service: string; api: string; sessionConfigured: boolean };
      assert.equal(body.status, 'ok');
      assert.equal(body.service, 'tropical-nomads-web');
      assert.equal(body.api, 'not-configured');
      assert.equal(body.sessionConfigured, (process.env.ACCOUNT_SESSION_SECRET?.length ?? 0) >= 32);
      if (process.env.ACCOUNT_SESSION_SECRET) {
        assert.equal(JSON.stringify(body).includes(process.env.ACCOUNT_SESSION_SECRET), false);
      }
    } finally {
      if (previous === undefined) {
        delete process.env.API_BASE_URL;
      } else {
        process.env.API_BASE_URL = previous;
      }
    }
  });
});
