# 06 — API reads published data

**Status:** not started. Read-only. No production hostname.

## Outcome

The API package in this monorepo reads the JSON the one-pager already publishes and returns it to the apps. The one-pager still loads those files itself. The API does not write tickets, payments, stock, or events, and it has no public production URL.

## Why it exists

The first product step is a web app that can call an API. The honest data for that step is already in the repo. `src/lib/data.ts` fetches `/data/events.json`, `/data/partners.json`, and `/data/socials.json`. The refresh script also writes artists, venues, agencies, and labels. The app repos must not ship a second copy of those files.

## Depends on

- [02 — Repository shape](02-repository-shape.md).
- [03 — Deployment change](03-deployment-change.md).

API style stays open. The response can match the files. That shape is provisional until the API style is chosen.

## To-do

1. Add the API in its package inside this repo. It reads only:
   - `public/data/events.json`
   - `public/data/artists.json`
   - `public/data/venues.json`
   - `public/data/labels.json`
   - `public/data/partners.json`
   - `public/data/socials.json`
   - `public/data/agencies.json`
2. Return the events envelope as stored (`schemaVersion`, `generatedAt`, `source`, `count`, `events`). Keep `source.provider` (`goabase`) and the external links.
3. Match `isUpcomingEvent` in `src/lib/data.ts`: an event is upcoming when `dateStart` is on or after the start of today in local time. Document that timezone assumption.
4. Leave the one-pager's `fetch` of `/data/*.json` in place.
5. Do not add ticket, order, payment, or stock routes. Do not call Goabase. Refresh stays `scripts/fetch-goabase-events.mjs`.
6. Local use only. Do not add the API to `amplify.yml` and do not give it a public hostname.
7. Responses stay free of secrets. These files have none today.

## Acceptance criteria

- A local client receives the same events the site publishes, including upcoming versus past.
- The one-pager still loads `/data/events.json` by itself.
- No public API host exists.

## Tests

Unit tests in the API package:

- The upcoming filter matches `isUpcomingEvent` for a fixed "today", including an event that starts today and one that ended yesterday.
- The events response still includes `source.provider` and does not add a ticket secret field.

The implementer runs those tests, plus `pnpm lint` and `pnpm build` for the one-pager.
