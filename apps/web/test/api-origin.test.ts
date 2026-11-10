import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { apiOrigin } from '../src/api-origin.ts';

describe('api origin', () => {
  it('is unset until a working base URL is configured', () => {
    assert.equal(apiOrigin({}), undefined);
    assert.equal(apiOrigin({ API_BASE_URL: 'not a url' }), undefined);
    assert.equal(apiOrigin({ API_BASE_URL: 'ftp://example.com' }), undefined);
    assert.equal(apiOrigin({ API_BASE_URL: 'https://api.example.com/socials' }), 'https://api.example.com');
    const source = readFileSync(new URL('../src/api-origin.ts', import.meta.url), 'utf8');
    assert.equal(source.includes('process.env.API_BASE_URL'), true);
  });
});
