import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  configuredAdminId,
  decideAccess,
  isRole,
  roleAllows,
  roleForNewAccount,
  roles,
  type AccessAction,
  type Role,
} from '../src/index.ts';

const matrixActions = [
  'create-party',
  'configure-event-tickets',
  'set-shop',
  'scan-ticket',
  'read-own-purchases',
  'read-other-purchases',
  'read-traces',
  'use-payment',
] as const satisfies readonly AccessAction[];

const matrix = {
  admin: {
    'create-party': 'allow',
    'configure-event-tickets': 'allow',
    'set-shop': 'allow',
    'scan-ticket': 'allow',
    'read-own-purchases': 'allow',
    'read-other-purchases': 'deny',
    'read-traces': 'allow',
    'use-payment': 'deny',
  },
  door: {
    'create-party': 'deny',
    'configure-event-tickets': 'deny',
    'set-shop': 'deny',
    'scan-ticket': 'allow',
    'read-own-purchases': 'allow',
    'read-other-purchases': 'deny',
    'read-traces': 'deny',
    'use-payment': 'deny',
  },
  user: {
    'create-party': 'deny',
    'configure-event-tickets': 'deny',
    'set-shop': 'deny',
    'scan-ticket': 'deny',
    'read-own-purchases': 'allow',
    'read-other-purchases': 'deny',
    'read-traces': 'allow',
    'use-payment': 'allow',
  },
} as const satisfies Record<Role, Record<(typeof matrixActions)[number], 'allow' | 'deny'>>;

describe('access matrix', () => {
  it('has admin, door, and user, and no other role', () => {
    assert.deepEqual(roles, ['admin', 'door', 'user']);
    assert.equal(isRole('bookings-admin'), false);
    assert.equal(isRole('inventory-admin'), false);
    assert.equal(isRole('owner'), false);
    assert.equal(roleForNewAccount(), 'user');
  });

  it('allows or denies each role for the named actions', () => {
    for (const role of roles) {
      for (const action of matrixActions) {
        const effect = roleAllows(role, action) ? 'allow' : 'deny';
        assert.equal(effect, matrix[role][action], `${role} ${action}`);
      }
    }
  });

  it('records the admin actor and denies door and user', () => {
    const allowed = decideAccess({ action: 'create-party', role: 'admin', actorId: 'admin-1' });
    assert.deepEqual(allowed, { effect: 'allow', actorId: 'admin-1' });
    assert.equal(decideAccess({ action: 'configure-event-tickets', role: 'door', actorId: 'door-1' }).effect, 'deny');
    assert.equal(decideAccess({ action: 'set-shop', role: 'user', actorId: 'user-1' }).effect, 'deny');
    assert.equal(decideAccess({ action: 'create-party', role: 'admin', actorId: '  ' }).effect, 'deny');
    assert.equal(decideAccess({ action: 'grant-admin', role: 'user', actorId: 'user-1' }).effect, 'deny');
    assert.equal(decideAccess({ action: 'grant-door', role: 'door', actorId: 'door-1' }).effect, 'deny');
    assert.deepEqual(decideAccess({ action: 'invite-door', role: 'admin', actorId: 'admin-1' }), {
      effect: 'allow',
      actorId: 'admin-1',
    });
  });

  it('lets door scan only an invited party, and lets an admin open a named party', () => {
    const invite = { partyIds: ['party-1'], revoked: false };
    assert.deepEqual(
      decideAccess({ action: 'scan-ticket', role: 'door', actorId: 'door-1', partyId: 'party-1', invite }),
      { effect: 'allow', actorId: 'door-1' },
    );
    assert.equal(
      decideAccess({ action: 'scan-ticket', role: 'door', actorId: 'door-1', partyId: 'party-2', invite }).effect,
      'deny',
    );
    assert.equal(
      decideAccess({
        action: 'scan-ticket',
        role: 'door',
        actorId: 'door-1',
        partyId: 'party-1',
        invite: { partyIds: ['party-1'], revoked: true },
      }).effect,
      'deny',
    );
    assert.deepEqual(decideAccess({ action: 'scan-ticket', role: 'admin', actorId: 'admin-1', partyId: 'party-1' }), {
      effect: 'allow',
      actorId: 'admin-1',
    });
    assert.equal(decideAccess({ action: 'read-event-roster', role: 'door', actorId: 'door-1', partyId: 'party-2', invite }).effect, 'deny');
    assert.equal(decideAccess({ action: 'scan-ticket', role: 'user', actorId: 'user-1', partyId: 'party-1', invite }).effect, 'deny');
    assert.equal(decideAccess({ action: 'create-guest-list', role: 'door', actorId: 'door-1' }).effect, 'deny');
    assert.deepEqual(decideAccess({ action: 'add-guest', role: 'admin', actorId: 'admin-1' }), {
      effect: 'allow',
      actorId: 'admin-1',
    });
  });

  it('lets a signed-in role read only that subject’s purchases', () => {
    assert.deepEqual(decideAccess({ action: 'read-own-purchases', role: 'user', actorId: 'user-1', subjectId: 'user-1' }), {
      effect: 'allow',
      actorId: 'user-1',
    });
    assert.equal(decideAccess({ action: 'read-own-purchases', role: 'user', actorId: 'user-1', subjectId: 'user-2' }).effect, 'deny');
    assert.equal(decideAccess({ action: 'read-other-purchases', role: 'user', actorId: 'user-1', subjectId: 'user-1' }).effect, 'deny');
    assert.deepEqual(decideAccess({ action: 'read-own-purchases', role: 'door', actorId: 'door-1', subjectId: 'door-1' }), {
      effect: 'allow',
      actorId: 'door-1',
    });
    assert.equal(decideAccess({ action: 'read-own-purchases', role: 'door', actorId: 'door-1', subjectId: 'user-1' }).effect, 'deny');
    assert.deepEqual(decideAccess({ action: 'read-own-purchases', role: 'admin', actorId: 'admin-1', subjectId: 'admin-1' }), {
      effect: 'allow',
      actorId: 'admin-1',
    });
    assert.equal(decideAccess({ action: 'read-own-purchases', role: 'admin', actorId: 'admin-1', subjectId: 'user-1' }).effect, 'deny');
    assert.equal(decideAccess({ action: 'read-other-purchases', role: 'admin', actorId: 'admin-1', subjectId: 'user-1' }).effect, 'deny');
    assert.deepEqual(decideAccess({ action: 'read-traces', role: 'admin', actorId: 'admin-1', subjectId: 'user-1' }), {
      effect: 'allow',
      actorId: 'admin-1',
    });
    assert.deepEqual(decideAccess({ action: 'read-traces', role: 'user', actorId: 'user-1', subjectId: 'user-1' }), {
      effect: 'allow',
      actorId: 'user-1',
    });
    assert.equal(decideAccess({ action: 'read-traces', role: 'user', actorId: 'user-1', subjectId: 'user-2' }).effect, 'deny');
    assert.equal(decideAccess({ action: 'read-traces', role: 'door', actorId: 'door-1', subjectId: 'door-1' }).effect, 'deny');
    assert.equal(decideAccess({ action: 'use-payment', role: 'user', actorId: 'user-1', subjectId: 'user-2' }).effect, 'deny');
    assert.equal(decideAccess({ action: 'use-payment', role: 'admin', actorId: 'admin-1', subjectId: 'admin-1' }).effect, 'deny');
  });

  it('keeps a published read open without adding a role or a password', () => {
    assert.deepEqual(decideAccess({ action: 'read-published' }), { effect: 'allow' });
    assert.equal(configuredAdminId({}), undefined);
    assert.equal(configuredAdminId({ INITIAL_ADMIN_SUB: ' sub-1 ' }), 'sub-1');
    const source = readFileSync(new URL('../src/access/matrix.ts', import.meta.url), 'utf8');
    assert.equal(source.toLowerCase().includes('password'), false);
  });
});
