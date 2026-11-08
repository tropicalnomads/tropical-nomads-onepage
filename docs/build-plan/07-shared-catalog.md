# 07 — Shared catalog

**Status:** not started. One set of artist, party, and calendar records.

## Outcome

Artists, parties/events, and the calendar are one JSON catalog the API serves. The public site reads the published view. The app repos use the shared schema from ticket 04. A second events catalog does not exist.

## Why it exists

The one-pager has parties and artists and no calendar or artist agenda. Bookings is supposed to build agendas from the same parties. Event fields already live in `src/lib/types/event.ts`: `id`, `title`, `type`, `dateStart`, `dateEnd`, `timezone`, `durationHours`, `venue`, `lineupRaw`, `stages`, `cardArtists`, `partnerIds`, `timetableFestivalId`, `media`, `description`, `organizer`, `images`, `links`, `source`. `scripts/fetch-goabase-events.mjs` writes the public files from a curated Goabase id list plus `scripts/data/`.

## Depends on

- [06 — API reads published data](06-api-reads-published-data.md).

## To-do

1. Treat the fields above as the published contract. Put that schema in the shared repo if ticket 04 has not already done it.
2. Add calendar entries and artist agendas that point at existing event ids and artist names. Stop and ask what an agenda contains beyond "this artist, these parties", and whether a party can stay off the public list. Do not guess. Both are still open.
3. Until the draft answer exists, the public list is whatever is in `public/data/events.json`.
4. Keep Goabase as the current refresh. Do not replace the script and do not make the API call Goabase.
5. Later writes from Bookings go through the API into this JSON. The browser cannot write `public/data`.
6. Leave `links.eventbrite`, `links.tickets`, and `links.goabase` as they are. In-app sales are ticket 13.
7. Do not move `timetable.tropical-nomads.com` into any repo.

## Acceptance criteria

- The owner has answered the agenda and draft questions, or the ticket is explicitly blocked on those answers.
- The API serves events from the existing public files.
- There is still a single `events.json`.

## Tests

Unit tests:

- A calendar entry whose event id is not in the catalog is invalid.
- An agenda entry points at artist names that exist in `artists.json` for the fixture.
- The draft filter, once the owner picks a rule, hides or shows the fixture event accordingly. If the rule is not chosen yet, the test asserts today's behavior: every event in the file is public.

The implementer runs those tests and the one-pager build.
