# 07 — Shared catalog

**Status:** done. The API serves every published party and every published artist. There is one `events.json`. This ticket did not add an agenda.

## Outcome

`GET /events` returns every party in `apps/one-pager/public/data/events.json`, in that order. `GET /artists` returns every artist in `artists.json`. Both reads use the party and artist schemas from `tropical-nomads-shared`. They do not keep a second field list, and they do not run the records through `parseParty` or `parseArtist`.

A record is not removed because it looks like a draft. Calendar entries and agendas stay on ticket 18. The one-pager still fetches `/data/events.json`. Goabase refresh stays `apps/one-pager/scripts/fetch-goabase-events.mjs`. The API does not call Goabase.

## Depends on

- [06 — API reads published data](06-api-reads-published-data.md).
- [28 — Types and schemas](28-types-and-schemas.md). The party and artist schemas already exist.

## Rules

- The public list is the parties in `apps/one-pager/public/data/events.json`. Do not add a second events file.
- Do not add calendar entries or agendas here. Ticket 18 does that in the second iteration.
- Keep `links.eventbrite`, `links.tickets`, and `links.goabase` as stored. In-app sales are ticket 13.
- Later writes from Bookings go through the API. This ticket does not add a write route. The browser cannot write `public/data`.
- Do not move `timetable.tropical-nomads.com` into any repo.

## Tests

`pnpm --filter tropical-nomads-api test` covers every published party id, a draft record that stays in the list, every artist name, the single events file, and the absent agenda routes. The one-pager `pnpm lint` and `pnpm build` still pass.
