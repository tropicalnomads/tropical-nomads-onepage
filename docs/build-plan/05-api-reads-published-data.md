# 05 — API reads published data

**Status:** not started. Read-only. No production hostname.

## Outcome

The API package can read the JSON the one-pager already publishes and return it to the app. The one-pager still loads those files itself. The API does not write tickets, payments, stock, or events. It has no public production URL.

## Why it exists

The first product step is a web app that can have an API. The data that step can honestly serve is the data already in the repo. `src/lib/data.ts` fetches `/data/events.json`, `/data/partners.json`, and `/data/socials.json`. The refresh script also writes `artists.json`, `venues.json`, `agencies.json`, and `labels.json`. An API that invented a new event feed would split the site and the app on day one.

## Depends on

- [02 — Monorepo shape](02-monorepo-shape.md). The API slot and the published JSON location exist.
- [03 — Deployment change](03-deployment-change.md). Adding the package must not create a production API host or change the www artifact.

Ticket 01's API style stays open. This ticket can expose the published documents in the simplest shape that matches the files. Do not treat that shape as the locked API style. Record it as provisional until ticket 01's open item is answered.

## To-do

1. Add the API in its package. It reads, and only reads, these published files from the one-pager package:
   - `public/data/events.json`
   - `public/data/artists.json`
   - `public/data/venues.json`
   - `public/data/labels.json`
   - `public/data/partners.json`
   - `public/data/socials.json`
   - `public/data/agencies.json`
2. Return events in the envelope the file already has (`schemaVersion`, `generatedAt`, `source`, `count`, `events`). Do not drop `source.provider` (`goabase`) or the external links on each event.
3. Provide the same upcoming/past split the page uses. `isUpcomingEvent` in `src/lib/data.ts` keeps an event whose `dateStart` is on or after the start of today in local time. Match that rule and name the timezone assumption in the API notes. Do not invent a second cutoff.
4. Leave `src/lib/data.ts` fetching `/data/*.json` for the one-pager. This ticket does not switch www over to the API.
5. Do not write files. Do not add ticket, order, payment, or stock routes. Do not add fields to the public JSON.
6. Do not call Goabase from the API. Refresh stays `scripts/fetch-goabase-events.mjs` until the owner changes that in ticket 06.
7. Run the API for local use by the app shell. Do not give it a production hostname, and do not add it to `amplify.yml`.
8. Auth for writes is out of scope here. These reads are the same documents the website already shows the world. Do not put secrets in the responses. There are no secrets in these files today; keep it that way.

## Done when

A local client can read the same events, artists, venues, partners, labels, agencies, and socials the site publishes, the one-pager still loads `/data/events.json` by itself, and no public API host exists.
