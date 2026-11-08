# 08 — Security baseline

**Status:** not started. Rules and the checks later tickets have to meet. Not an audit of the current sites, and not an auth-vendor choice.

## Outcome

Visitors, buyers, the check-in role, merch customers, Bookings admins, and inventory admins have distinct permissions. Public JSON stays free of ticket secrets and payment traces. Later tickets cannot mark a payment successful from the browser, issue a ticket the API did not create, or open Bookings admin and inventory admin to the public.

## Why it exists

Abuse resistance is a capability, not a page. The current site has no accounts, no ticket issuing, and no admin. The shop reserves on WhatsApp. The first time the API can write, the rules have to already exist, or tickets and stock will land in `public/data` because that is the only JSON the repo has.

Auth mechanism is still open (ticket 01). This ticket writes the permission rules and the data rules. It wires sign-in only after the owner accepts an auth approach. It does not pick that approach.

## Depends on

- [01 — Identify the stack](01-identify-stack.md), so the auth item is visibly still open and any accepted AWS lean is known. Do not select a specific AWS auth service here.
- [06 — Shared catalog](06-shared-catalog.md), so "who may write artists, parties, and the calendar" refers to the real shared records.

## To-do

1. Write the role rules into the docs, then enforce them on every write the later tickets add:
   - Visitor: read published events and the public store.
   - Buyer: read and present only their own tickets and payment traces. Whether a buyer needs an account is still open. Stop and ask before building "my tickets" sign-in in ticket 11. Do not decide it here.
   - Check-in role: validate tickets for allowed events and record the result. Cannot issue tickets or change prices. Who holds the role stays open until ticket 12.
   - Merch customer: buy what is in stock. Cannot edit counts.
   - Bookings admin: edit the party calendar, artists, and agendas. Team only.
   - Inventory admin: edit stock. Team only.
   - One person may hold several team roles. A check-in session is not also a catalog editor.
2. List the public files that may stay in the site bundle: `public/data/events.json`, `artists.json`, `venues.json`, `labels.json`, `partners.json`, `socials.json`, `agencies.json`, plus images. List what must never be added to them: ticket secrets, payment traces, check-in records, admin-only notes, credentials.
3. Require that a check-in asks the API whether the ticket is real. The client does not get to declare success.
4. Require that a payment status changes when the provider confirms it, not when the app says so. Raw card numbers are not stored. The provider is still unnamed; this to-do is the rule ticket 10 has to satisfy.
5. Require an attributable record for admin changes to money, tickets, or stock: who, when, what.
6. Do not implement rate-limit numbers, offline check-in, or a forged-ticket demo. Thresholds wait for the accepted stack. Offline check-in is an open question for ticket 12.
7. If the auth approach is still the open item from ticket 01, ship the written rules and the checks that do not need sign-in (public-file contents, no client-declared payment). Block the sign-in work until the owner picks an approach. Do not add an identity vendor in the meantime.

## Done when

The role and data rules are written down, public JSON is still the published catalog only, and no auth product was chosen or installed ahead of the owner's decision.
