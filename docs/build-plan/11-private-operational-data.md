# 11 — Private operational data

**Status:** not started. JSON files only. No database.

## Outcome

Orders, payment traces, issued tickets, check-in records, door invites, and live stock have a JSON store the API reads and writes. That store is not in `public/` and not in the one-pager `dist/`. Profiles from ticket 10 stay out of `public/data` as well. Published catalog files stay where they are.

## Why it exists

`public/data/events.json` is fetched by the browser and baked into SEO. Ticket secrets and invites cannot follow that path. Merch counts are still `MERCH_STOCK` in `src/lib/merch.ts`. Ticket 01 recommends Amazon RDS for PostgreSQL. That recommendation is not adopted here. JSON remains the store.

## Depends on

- [06 — API reads published data](06-api-reads-published-data.md).
- [09 — Security baseline](09-security-baseline.md).

## To-do

1. Propose a private JSON location. The API can write it. The one-pager bundle cannot. Public git is a poor fit for secrets and for a file that changes on every sale. The owner accepts the place before any secret is written.
2. Do not create the RDS instance from ticket 01. Do not migrate these collections into it. The private store is still JSON.
3. Create empty collections for orders, payment traces, issued tickets, check-ins, door invites, and stock counts. No sample secrets and no real customer data.
4. Two writers must not drop each other's updates. Record that the locking mechanism waits on the stack. Do not invent a database lock.
5. Keep `public/data/*.json` as the published catalog.
6. Leave `MERCH_STOCK` until ticket 16.
7. Confirm the one-pager production build does not contain the private files.

## Acceptance criteria

- The API can read and write an empty operational collection in the accepted location.
- A built one-pager `dist/` does not contain that location.
- No database was added.

## Tests

Unit test: a publisher function given a ticket secret and a public events file returns the events file unchanged and refuses to attach the secret. The implementer runs it and the one-pager build, then inspects `dist/` for the private path.
