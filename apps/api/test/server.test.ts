import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { apiHostname } from '../src/server.ts';

describe('api hostname', () => {
  it('stays on loopback when the variable is unset', () => {
    const previous = process.env.API_HOSTNAME;
    delete process.env.API_HOSTNAME;
    try {
      assert.equal(apiHostname(), '127.0.0.1');
      assert.equal(apiHostname(''), '127.0.0.1');
      assert.equal(apiHostname('127.0.0.1'), '127.0.0.1');
    } finally {
      if (previous === undefined) {
        delete process.env.API_HOSTNAME;
      } else {
        process.env.API_HOSTNAME = previous;
      }
    }
  });

  it('accepts the task interface and refuses any other address', () => {
    assert.equal(apiHostname('0.0.0.0'), '0.0.0.0');
    assert.throws(() => apiHostname('10.0.0.5'), /API_HOSTNAME/);
  });
});
