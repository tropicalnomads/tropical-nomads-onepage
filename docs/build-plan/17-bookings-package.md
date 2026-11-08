# 17 — Bookings in this monorepo

**Status:** not started. Moves the existing Bookings product into this repo. Does not invent a replacement, and does not put Bookings in its own new repository.

## Outcome

Bookings lives in this repository, deploys only to [bookings.tropical-nomads.com](https://bookings.tropical-nomads.com), and reads and writes the shared artists, parties, and calendar. The client app repos are not a Bookings repo.

## Why it exists

The header already links to Bookings. Its code is not here. The owner asked for separate repos for the customer apps, not for a separate Bookings codebase. Shared data is why Bookings stays beside the API.

## Depends on

- [02 — Repository shape](02-repository-shape.md).
- [03 — Deployment change](03-deployment-change.md).
- [07 — Shared catalog](07-shared-catalog.md).
- [09 — Security baseline](09-security-baseline.md).

## To-do

1. Find where `bookings.tropical-nomads.com` is built. If that source cannot be found, stop and ask the owner. Do not write a new Bookings product.
2. Bring that source into the Bookings package in this repo. Do not create a new remote for it.
3. Deploy it only to `bookings.tropical-nomads.com`. Do not publish it to www. Do not deploy the web, iOS, or Android repos as part of this.
4. Replace any private copy of artists, parties, or calendars with the shared catalog through the API.
5. Keep tickets, payments, profiles, and stock out of Bookings unless the owner expands sharing.
6. Bookings admin stays team-only.
7. Leave `timetable.tropical-nomads.com` where it is.
8. Verify www still serves the one-pager, the header link still opens Bookings, and a Bookings-only change does not deploy the client apps.

## Acceptance criteria

- Bookings builds from this repo and deploys only to its current host.
- It reads the shared catalog rather than a second `events.json`.
- No new Bookings repository exists.

## Tests

Unit test: a Bookings write of an artist name updates the shared catalog fixture and does not create a second artist file. The implementer runs that test, the one-pager build, and a Bookings-package build. They record that www did not change when only the Bookings package changed.
