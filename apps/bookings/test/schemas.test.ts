import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { decideAccess as sharedDecide, schemas as sharedSchemas } from 'tropical-nomads-shared';
import { decideAccess, schemas } from '../src/schemas.ts';

describe('bookings schemas', () => {
  it('uses the shared schema object', () => {
    assert.equal(schemas, sharedSchemas);
  });

  it('uses the shared access decision', () => {
    assert.equal(decideAccess, sharedDecide);
  });
});
