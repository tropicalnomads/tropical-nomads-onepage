# 07 — Upcoming events

**Status:** not started. Read-only list in the app. The one-pager's list stays.

## Outcome

The app's upcoming-events area lists the next parties from the shared catalog: what, when, where, and who is playing, with the partner context the page already stores. The one-pager's upcoming list still works from `public/data/events.json`.

## Why it exists

Upcoming events are the front door to tickets. The page already does this in `UpcomingEventsList`, using `getUpcomingEvents` and `sortByDateAsc`. The app has to show the same parties, not a hand-maintained second list. Ticket purchase stays a later ticket; today a ticket button leaves the site.

## Depends on

- [04 — App shell](04-app-shell.md). The upcoming-events area exists on web, iOS, and Android.
- [05 — API reads published data](05-api-reads-published-data.md).
- [06 — Shared catalog](06-shared-catalog.md). The list uses the shared event records, including the draft rule if the owner added one.

## To-do

1. Fill the upcoming-events area on all three platforms from the API, using the same cutoff as `isUpcomingEvent` (start of today, local time). Sort by `dateStart` ascending, as `sortByDateAsc` does.
2. Show, per event, the fields the page already treats as the decision to go: `title`, the formatted date range (`formatEventDate` / `spansMultipleEventDays` in `src/lib/data.ts`), `venue` (name, city, country), and the lineup summary (`getStageSummary`, which prefers `cardArtists` and then stage artists).
3. Show partners when `partnerIds` match `public/data/partners.json`. The page already resolves partners that way.
4. Show the banner from `images.bannerLocal` when the file exists under `public/events/banners/`.
5. Keep outbound links that are facts on the record, until ticket 11 replaces in-app sales for an event:
   - Ticket URL from `getPrimaryTicketUrl`: `links.eventbrite`, else `links.tickets`, else `links.goabase`.
   - A "tickets on sale" state only when `hasTicketSales` is true (`eventbrite` or `tickets` is set). A Goabase-only link is not a sale.
   - Timetable URL only when `timetableFestivalId` is set, built like `getEventTimetableUrl` (`https://timetable.tropical-nomads.com?festival=`). Do not rebuild that timetable inside the app.
6. Do not remove the upcoming list, the past gallery, or the Goabase refresh from the one-pager. Past events stay on www. This ticket does not have to rebuild the past gallery in the app.
7. If ticket 06's draft rule says an event is hidden, omit it here and on the public file the one-pager reads. Do not hide events that are in `events.json` today unless that rule says so.
8. Do not add a buy button that takes payment. The external link remains the purchase path until ticket 11.

## Done when

Web, iOS, and Android show the upcoming events from the shared catalog with the same dates, venues, lineup summary, partner ids, banners, and outbound ticket and timetable links the records already carry, and the one-pager list is unchanged.
