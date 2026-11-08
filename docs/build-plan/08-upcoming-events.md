# 08 — Upcoming events

**Status:** not started. Read-only list in the web app, including a phone browser. The one-pager list stays. No login required.

## Outcome

The web app lists the next parties from the shared catalog: what, when, where, and who is playing. A phone browser can use that list. The one-pager's upcoming list still reads `public/data/events.json`. Native apps are not part of this ticket.

## Why it exists

Upcoming events are the front door. The page already does this with `getUpcomingEvents` and `sortByDateAsc`. Visitors can see the list before they register. Buying waits for accounts and payment interfaces.

## Depends on

- [05 — Web app repository](05-app-repos.md).
- [06 — API reads published data](06-api-reads-published-data.md).
- [07 — Shared catalog](07-shared-catalog.md).

## To-do

1. Fill the upcoming-events area in the web app from the API, at a phone browser width and at desktop width. Use the same cutoff as `isUpcomingEvent`. Sort by `dateStart` ascending.
2. Show `title`, the date range (`formatEventDate` / `spansMultipleEventDays`), `venue`, and the lineup summary (`getStageSummary`: `cardArtists`, then stage artists).
3. Show partners when `partnerIds` match `public/data/partners.json`.
4. Show `images.bannerLocal` when the banner exists under `public/events/banners/`.
5. Keep outbound links until ticket 13 switches an event to in-app sales:
   - `getPrimaryTicketUrl`: `links.eventbrite`, else `links.tickets`, else `links.goabase`.
   - On sale only when `hasTicketSales` is true (`eventbrite` or `tickets`).
   - Timetable only when `timetableFestivalId` is set, via `getEventTimetableUrl`.
6. Do not remove the one-pager's upcoming list, past gallery, or Goabase refresh.
7. Do not add a buy button that takes payment.

## Acceptance criteria

- The web app, in a phone browser and on desktop, shows the upcoming events from the API with the fields above.
- A logged-out visitor can open the list.
- The one-pager list is unchanged.

## Tests

Unit tests around the shared helpers (or a port of them in the API):

- Sort order is `dateStart` ascending.
- `getPrimaryTicketUrl` prefers Eventbrite, then `tickets`, then Goabase, using a fixture event.
- `hasTicketSales` is false when only `links.goabase` is set.

The implementer runs those tests on a fixture copied from the shape of `public/data/events.json`, plus the one-pager `pnpm lint` and `pnpm build`.
