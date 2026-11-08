import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { schemas as sharedSchemas } from 'tropical-nomads-shared';
import { schemas } from '../src/schemas.ts';

describe('api schemas', () => {
  it('uses the shared schema object', () => {
    assert.equal(schemas, sharedSchemas);
  });
});
