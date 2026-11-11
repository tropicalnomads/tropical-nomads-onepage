import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sessionSecretModuleSource } from './write-session-secret.mjs';

describe('session secret module', () => {
  it('writes a long secret into the server module and leaves a short one empty', () => {
    const canary = 'c'.repeat(40);
    const empty = sessionSecretModuleSource('short');
    const filled = sessionSecretModuleSource(canary);
    assert.match(empty, /builtSessionSecret = "";/);
    assert.equal(empty.includes(canary), false);
    assert.match(filled, new RegExp(`builtSessionSecret = ${JSON.stringify(canary)};`));
    assert.equal(filled.includes('process.env'), false);
  });
});
