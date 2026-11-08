# 08 — Upcoming events

**Status:** done. The web app lists upcoming parties from the API. A visitor does not log in. Ticket links leave the app. The one-pager list still reads `public/data/events.json`.

## Outcome

The upcoming-events page shows the title, the date range, the venue, and the lineup. Partners appear when `partnerIds` match the published partners. A local banner is shown when that file exists under `public/events/banners/`. The same list works at a phone width and at desktop width. Event titles stay the catalog strings. Interface labels are English and Portuguese.

## Depends on

- [05 — Web app repository](05-app-repos.md).
- [06 — API reads published data](06-api-reads-published-data.md).
- [07 — Shared catalog](07-shared-catalog.md).
- [20 — English and Portuguese](20-internationalization.md).

## Rules

- `/events/upcoming` is sorted by `dateStart` ascending. The cutoff is still local midnight, the same rule as `isUpcomingEvent`.
- The ticket link prefers an https Eventbrite URL, then `tickets`, then Goabase. Sales styling is used only when Eventbrite or `tickets` is an https URL. A timetable link stays on `https://timetable.tropical-nomads.com`.
- The page does not take payment. There is no checkout and no price.
- `read-published` is allowed with no account. The page does not ask for a role.
- Banner and partner image routes read only those two directories. A path that leaves them is refused.
- The one-pager upcoming list, past gallery, and Goabase refresh stay.

## Tests

`pnpm --filter tropical-nomads-shared test` covers the sort and the ticket-link order on a fixture shaped like `events.json`. `pnpm --filter tropical-nomads-web test` loads the API list and checks the image route. The one-pager `pnpm lint` and `pnpm build` still pass.
