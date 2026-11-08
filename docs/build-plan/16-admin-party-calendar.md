# 16 — Admin party calendar

**Status:** not started. A team calendar inside Bookings admin. The parties are the shared event records.

## Outcome

Bookings admin has a calendar of parties and festivals. The team uses it to assemble each artist's agenda. A party on that calendar is the same record the public upcoming list can show. Saving updates the shared catalog. Visitors see the published view only.

## Why it exists

Lineups on the public site come from `stages`, `cardArtists`, and the Goabase refresh. There is no admin calendar and no agenda. The owner wants Bookings admin to be the place those agendas are built, from the parties themselves, so the public list and the artist schedule do not drift apart.

Ticket 06 asked what an agenda contains and whether a draft can stay off www. This ticket uses those answers. It does not reopen them as a blank sheet, and it does not override them.

## Depends on

- [06 — Shared catalog](06-shared-catalog.md). Calendar entries, agendas, and the draft rule exist as shared JSON.
- [15 — Bookings package](15-bookings-package.md). The admin UI lives in Bookings, on the Bookings deploy, behind the team role.

## To-do

1. Add the calendar to Bookings admin, team-only. List parties and festivals from the shared events, not from a Bookings-only file. Show at least `title`, `dateStart`, `dateEnd`, `timezone`, and `venue`, which is what makes a party placeable on a date.
2. Let a team member place artists from the shared artist catalog onto a party, and assemble an agenda that is the set of parties for one artist. Use the agenda contents the owner accepted in ticket 06. If that answer is missing, stop and finish ticket 06 first.
3. Save through the API into the shared JSON. The one-pager and the app read the published result. Do not maintain a second lineup in Bookings.
4. Apply the draft rule from ticket 06. If a party may stay unpublished, the calendar shows it to the team and the upcoming-events list does not. If the owner said every saved party is public, the public `events.json` view updates when the calendar saves.
5. Keep Goabase refresh from clobbering an admin edit silently. The refresh script rewrites `public/data/events.json` from `EVENT_SOURCES`. This ticket has to say which writer wins when both the calendar and `pnpm events` touch the same id. Stop and ask the owner if ticket 06 did not already answer whether Goabase remains an input. Do not delete the script in the meantime.
6. Do not build ticket sales, check-in, or stock into this calendar. Those stay in the app.
7. Record who saved a calendar change, per ticket 08.
8. Verify on the Bookings host only. Do not deploy the new app to make the calendar visible. The public list changes only through the published catalog the one-pager and ticket 07 already read.

## Done when

A team member can put parties on the Bookings calendar, build an artist agenda from them, save once, and see the published party on the public upcoming list, with drafts hidden if that was the accepted rule.
