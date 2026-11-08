# 06 — Shared catalog

**Status:** not started. Agrees the shared records, then teaches the API to serve that contract. Does not import Bookings yet.

## Outcome

Artists, parties/events, and the calendar are one set of JSON records that the future app and Bookings will both read and write. The public site reads the published view. The current `public/data` files are that published view. A second events catalog does not exist.

## Why it exists

The one-pager already has parties, artists, venues, partners, labels, and agencies, but it only reads them, and it has no calendar and no artist agenda. Bookings is supposed to build agendas from the same parties the public list shows. Without a shared contract, ticket 15 would invent a parallel dataset.

What exists today:

- Event shape in `src/lib/types/event.ts`: `id`, `title`, `type`, `dateStart`, `dateEnd`, `timezone`, `durationHours`, `venue`, `lineupRaw`, `stages`, `cardArtists`, `partnerIds`, `timetableFestivalId`, `media`, `description`, `organizer`, `images`, `links` (`goabase`, `eventbrite`, `tickets`, `instagram`), `source` (`provider: goabase`, numeric id).
- `scripts/fetch-goabase-events.mjs` writes the public files from a curated Goabase id list (`EVENT_SOURCES` in that script) plus hand-maintained files in `scripts/data/` (agencies, labels, artist affiliations, lineups, media, venues, partners). Agency and label data does not come from Goabase.
- `timetableFestivalId` is only a pointer at `https://timetable.tropical-nomads.com`. That site stays outside this repo.
- There is no calendar file and no agenda file.

## Depends on

- [05 — API reads published data](05-api-reads-published-data.md). The API is the door for later writes. This ticket extends what it reads; it does not add a second store.

## To-do

1. Start from the fields listed above. Write them down as the current published contract so the app and, later, Bookings use these records rather than a new schema invented beside them.
2. Add a calendar entry and an artist agenda as JSON records that point at existing event ids and artist names. Do not design those extra fields in a vacuum. Stop and ask the owner what an agenda contains beyond "this artist, these parties", and whether a party can sit on the admin calendar while staying off the public list. The master plan leaves both open. Do not guess.
3. Keep "saved" and "visible on www" able to differ once the owner answers the draft question. Until they answer, the public list remains "whatever is in `public/data/events.json`", which is today's behavior.
4. Keep Goabase as the current refresh input. Whether it stays is an open question. Do not replace `scripts/fetch-goabase-events.mjs` in this ticket. Do not make the API call Goabase.
5. Writes, when they arrive with Bookings in ticket 15, go through the API into this same JSON. The one-pager keeps reading the published files. Do not give the browser a way to write `public/data`.
6. Leave ticket links as they are: `links.eventbrite`, `links.tickets`, `links.goabase`. In-app ticket sales are ticket 11. This ticket does not add a price or a stock of tickets to the public file.
7. Do not move `timetable.tropical-nomads.com` into the monorepo.

## Done when

The owner has answered the agenda-contents and draft-visibility questions, the API serves events and artists from the existing public files plus the accepted calendar and agenda records, and there is still a single catalog.
