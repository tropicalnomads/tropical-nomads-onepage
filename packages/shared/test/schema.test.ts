import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { schemas } from '../src/index.ts';

describe('schema entry', () => {
  it('exports an empty field list for ticket 28', () => {
    assert.deepEqual(schemas, {});
  });
});
