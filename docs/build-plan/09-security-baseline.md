# 09 — Security baseline

**Status:** not started. Rules before accounts, money, and door invites. Cognito is the identity service. This ticket does not pick a payment company.

## Outcome

Visitors, signed-in buyers, invited door staff, merch customers, Bookings admins, and inventory admins have distinct permissions. An admin can grant the door-staff role. Public JSON stays free of ticket secrets, profiles, and payment traces.

## Why it exists

The current site has no accounts and no admin. The first write must not land secrets in `public/data`. The owner decided door staff are people an admin invites, and that they scan QR codes. This ticket writes that rule. Ticket 10 builds Cognito. Ticket 14 builds the invite.

## Depends on

- [01 — Identify the stack](01-identify-stack.md).
- [07 — Shared catalog](07-shared-catalog.md).

## To-do

1. Encode these rules, then enforce them on later writes:
   - Visitor: read published events and the public store. No account required for that.
   - Buyer: a Cognito user. Reads only their own tickets and payment traces. Must have a profile before purchase.
   - Door staff: an admin-invited user. Scans QR codes for the events on their invite. Cannot issue tickets, change prices, edit the lineup, or change stock. Buyers are not door staff unless an admin invites them.
   - Admin: the owner, and any later team member the owner marks as admin. Can invite and revoke door staff.
   - Merch customer: the same buyer account. Cannot edit counts.
   - Bookings admin and inventory admin: team only. Whether they are the same person as the product admin is still open. Keep the permissions distinct until the owner merges them.
2. Public files may stay in the site bundle: the existing `public/data/*.json` and images. Never add ticket secrets, profiles, payment traces, check-in records, or credentials.
3. Check-in asks the API. The client does not declare success.
4. Payment status changes inside the payment interface, later from the provider. The app does not set it. No raw card numbers.
5. Admin changes to money, tickets, stock, and door invites record who did it.
6. Do not pick rate-limit numbers or build offline check-in. Offline stays open for ticket 14.
7. Do not install a second identity product beside Cognito.

## Acceptance criteria

- The permission matrix includes visitor, buyer, door staff, admin, bookings admin, and inventory admin.
- Door staff cannot issue a ticket in the matrix.
- A buyer without an invite cannot scan.

## Tests

Unit tests of the permission matrix: role plus action returns allow or deny for issue-ticket, scan-ticket, invite-door-staff, edit-stock, and edit-calendar. The implementer runs them. No Cognito call is required for the matrix test. One-pager `pnpm lint` and `pnpm build` still pass.
