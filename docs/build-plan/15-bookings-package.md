# 15 — Bookings in this monorepo

**Status:** not started. Moves the existing Bookings product into this repo. Does not invent a new Bookings app, and does not merge it into www.

## Outcome

Tropical Nomads Bookings lives in the Bookings package of this repository, deploys on its own to [bookings.tropical-nomads.com](https://bookings.tropical-nomads.com), and reads and writes the shared artists, parties/events, and calendar. The one-pager and the new app use those same records. www and the new app stay on their own deploys.

## Why it exists

The header already sends people to Bookings (`SiteHeader` links to `https://bookings.tropical-nomads.com`). The product is not a disconnected project, and it is also not the one-pager. Its code is not in this repository. The monorepo slot from ticket 02 is empty until this ticket fills it with the real product.

A separate deploy is a publishing target. It is not a reason for a second git repository.

## Depends on

- [02 — Monorepo shape](02-monorepo-shape.md). The Bookings slot exists in this repo.
- [03 — Deployment change](03-deployment-change.md). www already deploys the one-pager alone, so the Bookings pipeline can be a second deploy without taking over www or launching the new app.
- [06 — Shared catalog](06-shared-catalog.md). The shared records and the draft rule, if any, exist.
- [08 — Security baseline](08-security-baseline.md). Bookings admin is team-only.

## To-do

1. Find where `bookings.tropical-nomads.com` is built today. If that source cannot be located, stop and ask the owner. Do not write a replacement Bookings product from scratch in this ticket.
2. Bring that source into the Bookings package. One git repository. Do not create a new remote for it.
3. Give it its own deploy to `bookings.tropical-nomads.com` only. Do not publish it to www. Do not publish the new app as part of this deploy. Do not point the one-pager's bookings link at a new host.
4. Replace any private copy of artists, parties, or calendars inside Bookings with reads and writes of the shared catalog, through the API. Both products read and write those entities. Bookings does not get a second `events.json`.
5. Keep operational data (tickets, payments, stock) out of Bookings unless the owner explicitly expands sharing. The master plan shares artists, parties/events, and the calendar. Inventory and tickets stay with the app side.
6. Bookings admin stays behind the team permission from ticket 08. The public Bookings site, whatever it shows today, must not become an editor for the catalog.
7. Leave `timetable.tropical-nomads.com` where it is.
8. Verify after the move: www still serves the one-pager, the header link still opens Bookings, Bookings still opens on its own host, and a Bookings-only change does not deploy the new app.

## Done when

The existing Bookings product builds from this repo, deploys only to `bookings.tropical-nomads.com`, and uses the shared catalog, and no second repository was created.
