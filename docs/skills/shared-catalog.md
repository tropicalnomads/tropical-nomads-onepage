# Shared catalog

Ticket 07. `apps/api/src/catalog.ts` serves the published parties and artists. `GET /events` returns every party in `apps/one-pager/public/data/events.json`. `GET /artists` returns every artist in `artists.json`. The party and artist field lists are `schemas` from `tropical-nomads-shared`.

The list does not remove a draft. The published file is the public list until ticket 18 chooses calendar entries. There is no agenda route and no write route. `POST /events` stays 405.

The one-pager still fetches `/data/events.json`. Refresh stays `apps/one-pager/scripts/fetch-goabase-events.mjs`. The API does not call Goabase, and it does not copy the JSON into another package.

Run `pnpm --filter tropical-nomads-api test` and `pnpm --filter tropical-nomads-api lint`.

The next ticket must not add an agenda, a draft filter, a second `events.json`, a write route for `public/data`, or a Goabase call from the API.

## Drafts stay in the file

The product can hide a draft party later. This ticket could have dropped `draft: true`, or it could serve the file as stored. Ticket 07 says not to apply a draft filter and not to guess what an agenda contains. The published file has no drafts, and every party in it is served.
