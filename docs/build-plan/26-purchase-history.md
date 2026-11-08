# 26 — Purchase and ticket history

**Status:** not started. The user role's own records. No admin tools and no door scanner.

## Outcome

A signed-in user sees their own ticket orders, their own merch orders, and their own issued tickets. Another person's records are not in the response. The screen does not create parties, configure tickets, edit merch, or scan a QR code.

## Why it exists

Ticket 13 lets a buyer open one ticket again. It does not list purchases. Ticket 15 starts a merch order and does not list it later. The owner asked every user who is not an admin or door staff to see both histories. This ticket is that list. It does not issue tickets or charge money again.

## Depends on

- [09 — Security baseline](09-security-baseline.md).
- [10 — Accounts and profile](10-accounts-and-profile.md).
- [13 — Tickets](13-tickets.md).
- [15 — Merch store](15-merch-store.md).
- [20 — English and Portuguese](20-internationalization.md).

## To-do

1. Add one history area in the web app for the user role. Show ticket orders and merch orders for the signed-in user, with amount, currency, status, and time from the private traces. Show issued tickets for that same user, without the door secret in the list response.
2. The API takes the user from the session. An id in the query does not select another account.
3. Deny the history area to the door role and to the admin role. Door keeps the scanner from ticket 14. Admin keeps party and merch tools from tickets 16 and 18.
4. A `pending_provider` order appears as unpaid. Do not mark it paid in this ticket.
5. Do not add a team view of every customer's orders.
6. Keep the records out of `public/data`.

## Acceptance criteria

- A user sees only their ticket orders, merch orders, and issued tickets.
- A request for another user's records is denied.
- Door and admin sessions do not get this area.
- No party editor, merch editor, or QR scanner is on the screen.

## Tests

Unit tests:

- History for user A includes A's ticket order and A's merch order, and excludes B's.
- A query that names B while the session is A is denied.
- The door role and the admin role are denied.
- The list payload has no ticket secret.

The implementer runs those tests and the one-pager build.
