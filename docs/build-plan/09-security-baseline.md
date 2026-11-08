# 09 — Security baseline

**Status:** not started. The access list, before accounts, money, and door invites. Cognito is the identity service. This ticket does not pick a payment company.

## Outcome

Signed-in people have one of three roles: admin, door, or user. A new account is a user. Public pages stay readable without an account. Public JSON stays free of ticket secrets, profiles, and payment traces. Later tickets enforce this list. They do not invent a fourth role.

## Why it exists

The current site has no accounts and no admin. The owner decided the access list is three roles. Door staff only scan QR codes. Admins create parties and merch. Everyone else sees their own purchases and tickets. Bookings editing and stock editing are admin work, not separate roles.

## Depends on

- [01 — Identify the stack](01-identify-stack.md).
- [07 — Shared catalog](07-shared-catalog.md).

## To-do

1. Encode these three roles. One account has one role.
   - Admin: create a party and set its description, image, and artists. Configure that event's tickets. Add merch and set its price, sizes, and stock. Invite and revoke door staff. Cannot use the door scanner as a shortcut around those limits.
   - Door: check people in by scanning a QR code, for the events on their invite. Cannot create or edit a party, configure tickets, add merch, or set price, sizes, or stock.
   - User: see their own purchase history and their own ticket history. Buy through the later purchase tickets. Cannot open admin tools or the door scanner.
2. A person with no account can read published events and the public store. That is not a fourth role.
3. Registration in ticket 10 creates a user. The owner is the first admin, recorded as configuration, not as a password in the repo. An admin may grant admin or door. A user cannot grant either.
4. Public files may stay in the site bundle: the existing `public/data/*.json` and images. Never add ticket secrets, profiles, payment traces, check-in records, or credentials.
5. Check-in asks the API. The client does not declare success. Payment status changes inside the payment interface. The app does not set it. No raw card numbers.
6. An admin change to a party, a ticket offer, merch, stock, or a door invite records who did it.
7. Do not pick rate-limit numbers or build offline check-in. Offline stays open for ticket 14.
8. Do not install a second identity product beside Cognito.
9. Do not keep a separate bookings-admin or inventory-admin role.

## Acceptance criteria

- The matrix has admin, door, and user, and no other role.
- Admin is allowed to create a party, configure that event's tickets, and set merch price and stock. Door and user are denied those actions.
- Door is allowed to scan. Admin and user are denied.
- User is allowed to read their own purchases and tickets. A read of someone else's id is denied. Door is denied the history tools.

## Tests

Unit tests of the matrix: role plus action returns allow or deny for create-party, configure-event-tickets, set-merch, scan-ticket, read-own-purchases, and read-other-purchases. The implementer runs them. No Cognito call is required. One-pager `pnpm lint` and `pnpm build` still pass.
