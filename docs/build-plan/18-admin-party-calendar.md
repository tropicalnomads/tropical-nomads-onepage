# 18 — Admin party calendar

**Status:** not started. Team calendar inside Bookings admin.

## Outcome

Bookings admin shows a calendar of parties and festivals. The team builds each artist's agenda from those parties. A party on the calendar is the same record the public upcoming list can show. Visitors see the published view only.

## Why it exists

Public lineups come from `stages`, `cardArtists`, and the Goabase refresh. There is no admin calendar. Ticket 07 asked what an agenda contains and whether drafts stay off www. This ticket uses those answers.

## Depends on

- [07 — Shared catalog](07-shared-catalog.md).
- [17 — Bookings package](17-bookings-package.md).

## To-do

1. Add the calendar to Bookings admin, team-only. List parties from the shared events. Show `title`, `dateStart`, `dateEnd`, `timezone`, and `venue`.
2. Place artists from the shared artist catalog onto a party and assemble an agenda. Use the contents accepted in ticket 07. If that answer is missing, stop.
3. Save through the API into the shared JSON. Do not keep a second lineup inside Bookings.
4. Apply the draft rule from ticket 07.
5. The refresh script rewrites `public/data/events.json` from `EVENT_SOURCES`. Say which writer wins when the calendar and `pnpm events` touch the same id. Do not delete the script. Ticket 22 is the later integrations tab and is not this writer. Do not stop this ticket to wait for it.
6. Do not build ticket sales, QR check-in, or stock into this calendar.
7. Record who saved a calendar change.
8. Verify on the Bookings host only.

## Acceptance criteria

- A team member can place a party, attach an artist, save once, and see the published party on the upcoming list.
- A draft, if the accepted rule hides drafts, is visible in admin and absent from the public list.
- The save is attributable.

## Tests

Unit tests on fixtures:

- Saving an agenda points at an event id that exists.
- The published filter matches the draft rule from ticket 07.
- A second save by another user keeps both actor ids in the change record.

The implementer runs those tests and the one-pager build.
