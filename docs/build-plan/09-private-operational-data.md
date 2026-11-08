# 09 — Private operational data

**Status:** not started. JSON files only. No database.

## Outcome

Orders, payment traces, issued tickets, check-ins, and live stock counts have a JSON store the API can read and write. That store is not inside `public/`, not in the one-pager's `dist/`, and not readable as part of the website bundle. Published events, artists, venues, partners, labels, agencies, and socials stay where they are.

## Why it exists

The only JSON in the repo today is published on purpose. `public/data/events.json` is fetched by the browser and baked into SEO at build time. Ticket secrets and payment traces cannot follow that path. Merch counts are not JSON at all; they are `MERCH_STOCK` in `src/lib/merch.ts`. Tickets, payments, check-in, and inventory all need a private place before they write anything.

The master plan already says the store is JSON until a database is chosen, and that the private location (git versus a private file location) is undecided. This ticket forces that location decision without picking a database or an AWS service.

## Depends on

- [05 — API reads published data](05-api-reads-published-data.md). The API is the only writer.
- [08 — Security baseline](08-security-baseline.md). The public-versus-private list is the rule this store has to meet.

## To-do

1. Propose a private JSON location to the owner. It has to be writable by the API package, absent from the one-pager bundle, and still files of JSON. Public git is a poor fit for ticket secrets and for a file that changes on every sale. Bring that constraint with the proposal. Do not start writing secrets before the owner accepts the place.
2. Leave the AWS product for that place unnamed unless ticket 01's accepted recommendation already named one. "Which AWS service" stays open. Do not introduce a database.
3. Create empty collections, or one file per collection, for: orders, payment traces, issued tickets, check-in records, and stock counts. No sample secrets, no copied real customer data.
4. Document that two writers (two doors, or a door and an admin) must not drop each other's updates. The mechanism waits on the stack. Record the gap. Do not pretend a database lock exists.
5. Keep `public/data/*.json` as the published catalog the one-pager and ticket 05 already read. The API may publish a view of an event into those files later. It does not publish operational records into them.
6. Leave `src/lib/merch.ts` in place until ticket 14 moves the counts. This ticket only reserves the stock collection.
7. Confirm a production build of the one-pager does not contain the private files. Confirm `amplify.yml` still publishes only the one-pager `dist/`.

## Done when

The owner has accepted the private JSON location, the API can read and write the empty operational collections there, the one-pager artifact does not contain them, and no database was added.
