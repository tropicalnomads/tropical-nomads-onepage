# Build plan

Recommended order for the owner to review before any build. Each file is one ticket. Do them one at a time, in this order, unless the owner reorders them. This folder does not implement the tickets.

The order follows the master plan: settle the lean and the repository first, keep [www.tropical-nomads.com](https://www.tropical-nomads.com) shipping on its own, then do the first product step (a web app with an API), then the purchase path, then merch, then Bookings. Bookings comes after that first step because its code is not in this repository today.

Nothing here locks the stack, the AWS service list, the payment provider, the ticket format, who checks people in, or the languages. Next.js and AWS are the owner's lean, to evaluate in ticket 01.

## Order

| Step | Ticket | Depends on | What it covers |
| --- | --- | --- | --- |
| 1 | [Identify the stack](01-identify-stack.md) | None | Owner's Next.js and AWS lean. Leaves API style, database, auth, payments, and iOS/Android production open. |
| 2 | [Monorepo shape](02-monorepo-shape.md) | 01 | One-pager stays one package. Slots for the frontend, the API, and Bookings. JSON until a database. No extra repos. |
| 3 | [Deployment change](03-deployment-change.md) | 02 | The current site keeps its own deploy. The new app does not go live. |
| 4 | [App shell](04-app-shell.md) | 01, 02, 03 | One product for web, iOS, and Android. Shell only. Still not deployed. |
| 5 | [API reads published data](05-api-reads-published-data.md) | 02, 03 | API over the JSON this repo already publishes. No production host. |
| 6 | [Shared catalog](06-shared-catalog.md) | 05 | Artists, parties/events, and calendar as one shared set of records. |
| 7 | [Upcoming events](07-upcoming-events.md) | 04, 05, 06 | Capability: upcoming events, from the real event file. |
| 8 | [Security baseline](08-security-baseline.md) | 01, 06 | Capability: abuse resistance. Rules before any money or admin write. |
| 9 | [Private operational data](09-private-operational-data.md) | 05, 08 | JSON for orders, tickets, check-ins, and stock, outside `public/data/`. |
| 10 | [Payments](10-payments.md) | 08, 09 | Capability: payment traces. Provider stays open. |
| 11 | [Tickets](11-tickets.md) | 07, 10 | Capability: buy a ticket and generate it. Format stays open. |
| 12 | [Check-in](12-check-in.md) | 04, 11 | Capability: check-in area. Who staffs it stays open. |
| 13 | [Merch store](13-merch-store.md) | 04, 09 | Capability: merch, starting from the two shirts already on the page. |
| 14 | [Inventory](14-inventory.md) | 08, 13 | Capability: stock control. Counts leave `src/lib/merch.ts`. |
| 15 | [Bookings package](15-bookings-package.md) | 02, 03, 06, 08 | Capability: Bookings in this monorepo, own deploy, shared data. |
| 16 | [Admin party calendar](16-admin-party-calendar.md) | 06, 15 | Capability: party calendar and artist agendas. |

## Capabilities

| Master-plan capability | Ticket |
| --- | --- |
| Upcoming events | 07 |
| Tickets | 11 |
| Check-in | 12 |
| Payments | 10 |
| Merch store | 13 |
| Inventory | 14 |
| Abuse-resistant security | 08, then enforced again in 09–12 and 14–16 |
| Bookings in this monorepo | 02 names the slot; 15 brings the product in |
| Admin party calendar | 16 |

Languages have no ticket that decides them. The one-pager keeps English and Portuguese in `src/i18n/`. The app shell must not invent a language list.

## How to use a ticket

- The outcome is what is true when the ticket is finished.
- A dependency that is unfinished blocks the ticket.
- A checkpoint inside a ticket stops the work until the owner answers it. Do not fill an open question with a guess.
- The one-pager at `www` stays up through every step.
- Ticket 03 is the rule for deploys: the new app is not published as part of becoming a monorepo. Later tickets still do not launch the app on their own. A production launch of the new app is a separate owner request.

## Repo facts these tickets rely on

- The site is one Vite package, name `tropical-nomads-page`, built with `pnpm build` (`tsc -b && vite build`) into `dist/`.
- There is no workspace file yet. `amplify.yml` installs and builds at the repo root and publishes `dist/`.
- Published data is `public/data/*.json`, refreshed by `scripts/fetch-goabase-events.mjs`.
- Merch stock, price, and the WhatsApp reserve link live in `src/lib/merch.ts`, not in JSON.
- Ticket buttons leave the site via `getPrimaryTicketUrl` in `src/lib/data.ts`.
- Bookings is a header link to `https://bookings.tropical-nomads.com`. Its code is not in this repo.
- Some events link out to `timetable.tropical-nomads.com`. That site is not part of these tickets.
