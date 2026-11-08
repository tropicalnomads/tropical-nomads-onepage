# 07 — Shared catalog

**Status:** not started. One set of artist, party, and calendar records.

## Outcome

Artists and parties/events are one JSON catalog the API serves. The public site reads the published view. The app repos use the shared schema from ticket 28. A second events catalog does not exist. Calendar entries and agendas are the second iteration, in ticket 18.

## Why it exists

The one-pager has parties and artists and no calendar or artist agenda. Bookings is supposed to build agendas from the same parties. Event fields already live in `src/lib/types/event.ts`. Ticket 28 puts that shape, plus an artist id, into the shared schema. `scripts/fetch-goabase-events.mjs` writes the public files from a curated Goabase id list plus `scripts/data/`.

## Depends on

- [06 — API reads published data](06-api-reads-published-data.md).
- [28 — Types and schemas](28-types-and-schemas.md). The party and artist schemas already exist.

## To-do

1. Use the party and artist schemas from ticket 28. Do not add a second event shape in this ticket.
2. Do not add calendar entries or agendas here. Ticket 18 does that in the second iteration, after the questions about agenda contents and drafts have an answer. Do not guess those answers, and do not block this ticket on them.
3. The public list is whatever is in `public/data/events.json`.
4. Keep Goabase as the current one-pager refresh. Do not replace the script and do not make the API call Goabase. The integrations tab in ticket 22 is a later party list for artist offers. This ticket does not wait for it.
5. Later writes from Bookings go through the API into this JSON. The browser cannot write `public/data`.
6. Leave `links.eventbrite`, `links.tickets`, and `links.goabase` as they are. In-app sales are ticket 13.
7. Do not move `timetable.tropical-nomads.com` into any repo.

## Acceptance criteria

- The API serves events from the existing public files.
- There is still a single `events.json`.
- This ticket did not add an agenda. That stays on ticket 18.

## Tests

Unit tests:

- Every event in the public fixture is served. A draft filter is not applied in this ticket.

The implementer runs those tests and the one-pager build.
