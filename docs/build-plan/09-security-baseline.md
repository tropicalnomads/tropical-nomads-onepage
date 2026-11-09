# 09 — Security baseline

**Status:** done. The access list is admin, door, and user. Cognito is still the identity service. No account is created here, and no payment company is named.

## Outcome

`packages/shared/src/access/matrix.ts` is the only access list. A signed-in person has one role. A new account is a user. A visitor can read published data, and that is not a fourth role. The API and Bookings import `decideAccess` from this package.

Admin may create a party, configure that event's tickets, set shop, invite or revoke door staff, and grant admin or door. The allow result carries the actor id. An admin may scan a published party without an invite. Door may scan only a party on an invite the API loads. User may read their own purchases. A read of someone else's id is denied. A user cannot scan. Door and user cannot use the admin actions.

The first admin is `INITIAL_ADMIN_SUB` in configuration. This repo does not store a credential. No Cognito call is made.

## Depends on

- [01 — Identify the stack](01-identify-stack.md).
- [07 — Shared catalog](07-shared-catalog.md).

## Rules

- The roles are `admin`, `door`, and `user`. There is no bookings-admin role and no inventory-admin role.
- Public JSON stays the published files. This ticket does not add ticket secrets, profiles, payment traces, check-in records, or credentials.
- Check-in and payment status stay on their own tickets. The client does not declare either one here.
- Do not pick rate-limit numbers or build offline check-in.
- Do not install a second identity product beside Cognito.

## Tests

`pnpm --filter tropical-nomads-shared test` covers the matrix. The API and Bookings tests check they use the same `decideAccess`. The one-pager `pnpm lint` and `pnpm build` still pass.
