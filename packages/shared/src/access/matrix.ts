import { roles, type Role } from '../schema/values.ts';

export { roles };
export type { Role };

export const accessActions = [
  'create-party',
  'configure-event-tickets',
  'set-shop',
  'scan-ticket',
  'read-own-purchases',
  'read-other-purchases',
  'read-traces',
  'use-payment',
  'grant-admin',
  'grant-door',
  'invite-door',
  'revoke-door',
  'create-guest-list',
  'add-guest',
  'read-event-roster',
  'read-published',
] as const;

export type AccessAction = (typeof accessActions)[number];

export interface DoorInviteScope {
  partyIds: readonly string[];
  revoked: boolean;
}

export interface AccessAllow {
  effect: 'allow';
  actorId?: string;
}

export interface AccessDeny {
  effect: 'deny';
}

export type AccessDecision = AccessAllow | AccessDeny;

type AdminAction =
  | 'create-party'
  | 'configure-event-tickets'
  | 'set-shop'
  | 'grant-admin'
  | 'grant-door'
  | 'invite-door'
  | 'revoke-door'
  | 'create-guest-list'
  | 'add-guest';

export type AccessRequest =
  | { action: AdminAction; role: Role; actorId: string }
  | {
      action: 'scan-ticket' | 'read-event-roster';
      role: Role;
      actorId: string;
      partyId: string;
      invite?: DoorInviteScope;
    }
  | { action: 'read-own-purchases' | 'read-other-purchases'; role: Role; actorId: string; subjectId: string }
  | { action: 'read-traces' | 'use-payment'; role: Role; actorId: string; subjectId: string }
  | { action: 'read-published' };

export function roleForNewAccount(): Role {
  return 'user';
}

export function isRole(value: string): value is Role {
  return (roles as readonly string[]).includes(value);
}

function knownRole(role: Role): Role {
  switch (role) {
    case 'admin':
    case 'door':
    case 'user':
      return role;
    default: {
      const unexpected: never = role;
      return unexpected;
    }
  }
}

/** Role matrix only. A request goes through `decideAccess`, which also checks the actor and the invite. */
export function roleAllows(role: Role, action: AccessAction): boolean {
  const known = knownRole(role);
  switch (action) {
    case 'create-party':
    case 'configure-event-tickets':
    case 'set-shop':
    case 'grant-admin':
    case 'grant-door':
    case 'invite-door':
    case 'revoke-door':
    case 'create-guest-list':
    case 'add-guest':
      return known === 'admin';
    case 'scan-ticket':
    case 'read-event-roster':
      return known === 'door' || known === 'admin';
    case 'read-own-purchases':
    case 'use-payment':
      return known === 'user';
    case 'read-traces':
      return known === 'admin' || known === 'user';
    case 'read-other-purchases':
      return false;
    case 'read-published':
      return true;
    default: {
      const unexpected: never = action;
      return unexpected;
    }
  }
}

function deny(): AccessDeny {
  return { effect: 'deny' };
}

function allow(actorId?: string): AccessAllow {
  if (actorId === undefined) {
    return { effect: 'allow' };
  }
  return { effect: 'allow', actorId };
}

function actorIdOf(value: string): string | undefined {
  const id = value.trim();
  return id === '' ? undefined : id;
}

function partyAccess(role: Role, actorId: string, partyId: string, invite: DoorInviteScope | undefined): AccessDecision {
  const party = partyId.trim();
  if (party === '') {
    return deny();
  }
  if (role === 'admin') {
    return allow(actorId);
  }
  if (role === 'door' && invite && !invite.revoked && invite.partyIds.includes(party)) {
    return allow(actorId);
  }
  return deny();
}

/**
 * Allow or deny one request.
 * An admin change includes the actor id so the later write can record who did it.
 * A door scan allows only a party on an invite. An admin can open check-in for a named party.
 * Reading someone else's purchases is denied for every role.
 * Published reads stay open. That is not a fourth role.
 */
export function decideAccess(request: AccessRequest): AccessDecision {
  if (request.action === 'read-published') {
    return allow();
  }
  if (!isRole(request.role)) {
    return deny();
  }
  const actorId = actorIdOf(request.actorId);
  if (!actorId || !roleAllows(request.role, request.action)) {
    return deny();
  }
  switch (request.action) {
    case 'create-party':
    case 'configure-event-tickets':
    case 'set-shop':
    case 'grant-admin':
    case 'grant-door':
    case 'invite-door':
    case 'revoke-door':
    case 'create-guest-list':
    case 'add-guest':
      return allow(actorId);
    case 'scan-ticket':
    case 'read-event-roster':
      return partyAccess(request.role, actorId, request.partyId, request.invite);
    case 'read-own-purchases':
      return request.subjectId === actorId ? allow(actorId) : deny();
    case 'read-traces':
      if (request.role === 'admin') {
        return allow(actorId);
      }
      return request.subjectId === actorId ? allow(actorId) : deny();
    case 'use-payment':
      return request.subjectId === actorId ? allow(actorId) : deny();
    case 'read-other-purchases':
      return deny();
    default: {
      const unexpected: never = request;
      return unexpected;
    }
  }
}

/** The owner is the first admin. The Cognito sub is configuration outside this file. */
export function configuredAdminId(env: { INITIAL_ADMIN_SUB?: string }): string | undefined {
  const value = env.INITIAL_ADMIN_SUB?.trim();
  if (!value) {
    return undefined;
  }
  return value;
}
