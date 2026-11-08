# Security baseline

Ticket 09. The access list lives in `packages/shared/src/access/matrix.ts`. The roles are `admin`, `door`, and `user`. Call `decideAccess` for a request. `roleAllows` is the role matrix only.

Admin actions return the actor id so a later write can record who did it. An empty actor id is denied. Door can scan when the invite was loaded by the API, is not revoked, and includes that party. Do not take the invite from the browser. User can read purchases only when the subject id is their own actor id. Every role is denied someone else's purchases. Admin and user cannot scan.

`read-published` is allowed with no account. It is not a role. `roleForNewAccount` returns `user`. The first admin is `INITIAL_ADMIN_SUB` in the environment. Do not put a credential in the repo.

The API and Bookings re-export `decideAccess`. Do not copy the matrix. No Cognito call is made here. Private orders, tickets, and stock are files in `data/operational`, not browser routes. See [private-operational-data.md](private-operational-data.md). Profiles use the same private directory and do not add a role. See [accounts-and-profile.md](accounts-and-profile.md).

Run `pnpm --filter tropical-nomads-shared test`.

A payment status sent by the app is ignored. See [payment-interfaces.md](payment-interfaces.md).

The next ticket must not add a fourth role, install another identity product, accept an invite from the browser, or let the client declare a check-in or a confirmed payment.

## Three roles

The owner asked for admin, door, and user. A visitor reading the published list could have been a fourth role. The published read stays an action with no role, and the role list stays those three.
