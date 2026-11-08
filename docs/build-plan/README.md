# Build plan

Recommended order for the owner to review before any build. Each file is one ticket. Do them one at a time, in this order, unless the owner reorders them. This folder does not implement the tickets.

Settle the repository split first, keep [www.tropical-nomads.com](https://www.tropical-nomads.com) shipping on its own, then share types and theme, then stand up the three app repos, then the API, then accounts, then the purchase path. Payment provider connection waits. The interfaces do not.

Owner decisions from 8 November 2026, already in this order:

- Login and registration use Amazon Cognito, with Google and Apple sign-in.
- A user profile holds identity, a billing address, an avatar, and payment methods. The payment company is connected later.
- An admin invites people who scan QR codes and help at the door.
- The web app, iOS, and Android are separate repositories. A fourth shared repository holds theme colors, base components, types, schemas, and constants.
- This repository still holds the one-pager, the API, Bookings, and the JSON. Bookings is not split into its own repo.

Still open: the payment company, the database, API style, languages, and which technology builds the shared UI components so three repos can use them. Next.js stays the lean for the web app, not a lock.

## Order

| Step | Ticket | Depends on | What it covers |
| --- | --- | --- | --- |
| 1 | [Identify the stack](01-identify-stack.md) | None | Cognito, Google, Apple, and the app repos. Leaves the database, API style, and payment company open. |
| 2 | [Repository shape](02-repository-shape.md) | 01 | This monorepo keeps the one-pager, API, Bookings, and JSON. Clients are four other repos. |
| 3 | [Deployment change](03-deployment-change.md) | 02 | www keeps its own deploy. No new app goes live. |
| 4 | [Shared client repo](04-shared-client-repo.md) | 02 | Theme, components, types, schemas, constants. |
| 5 | [App repositories](05-app-repos.md) | 03, 04 | Empty web, iOS, and Android repos wired to the shared repo. |
| 6 | [API reads published data](06-api-reads-published-data.md) | 02, 03 | API over the JSON this repo already publishes. |
| 7 | [Shared catalog](07-shared-catalog.md) | 06 | Artists, parties/events, and calendar. |
| 8 | [Upcoming events](08-upcoming-events.md) | 05, 06, 07 | Capability: upcoming events. Public, no login required. |
| 9 | [Security baseline](09-security-baseline.md) | 01, 07 | Roles, including admin invite of door staff. |
| 10 | [Accounts and profile](10-accounts-and-profile.md) | 04, 05, 09 | Cognito, Google, Apple, and the user record. |
| 11 | [Private operational data](11-private-operational-data.md) | 06, 09 | JSON for orders, tickets, check-ins, and stock, outside `public/data/`. |
| 12 | [Payment interfaces](12-payment-interfaces.md) | 09, 10, 11 | Interfaces and user payment methods. No provider yet. |
| 13 | [Tickets](13-tickets.md) | 08, 12 | Buy a ticket. The door copy is a QR code. |
| 14 | [Check-in](14-check-in.md) | 05, 10, 13 | Admin invites door staff. They scan QR codes. |
| 15 | [Merch store](15-merch-store.md) | 05, 10, 12 | Merch, starting from the two shirts on the page. |
| 16 | [Inventory](16-inventory.md) | 09, 15 | Stock control. Counts leave `src/lib/merch.ts`. |
| 17 | [Bookings package](17-bookings-package.md) | 02, 03, 07, 09 | Bookings in this monorepo, own deploy, shared data. |
| 18 | [Admin party calendar](18-admin-party-calendar.md) | 07, 17 | Party calendar and artist agendas. |

## Capabilities

| Master-plan capability | Ticket |
| --- | --- |
| Upcoming events | 08 |
| Tickets | 13 |
| Check-in | 14 |
| Payments | 12 |
| Merch store | 15 |
| Inventory | 16 |
| Abuse-resistant security | 09, then again in 10–16 |
| Bookings in this monorepo | 02 names the slot; 17 brings the product in |
| Admin party calendar | 18 |

Languages have no ticket that decides them. The one-pager keeps English and Portuguese in `src/i18n/`.

## Acceptance criteria and tests

Every ticket ends with acceptance criteria. When that ticket is built:

- Pure rules get unit tests: dates, permissions, schema checks, payment-interface results, stock math, QR payload checks, profile validation.
- The implementer runs those tests. When the ticket touches this repo, they also run the one-pager's `pnpm lint` and `pnpm build`.
- A ticket is not done if a test that passed before now fails.
- This planning change does not add a test runner or any dependency.

## How to use a ticket

- The outcome is what is true when the ticket is finished.
- A dependency that is unfinished blocks the ticket.
- A checkpoint stops the work until the owner answers it.
- www stays up through every step.
- Ticket 03 is the deploy rule: client repos and the API are not published as part of the monorepo move.

## Repo facts these tickets rely on

- The site is one Vite package, name `tropical-nomads-page`, built with `pnpm build` (`tsc -b && vite build`) into `dist/`.
- There is no workspace file yet. `amplify.yml` installs and builds at the repo root and publishes `dist/`.
- Published data is `public/data/*.json`, refreshed by `scripts/fetch-goabase-events.mjs`.
- Merch stock, price, and the WhatsApp reserve link live in `src/lib/merch.ts`, not in JSON.
- Ticket buttons leave the site via `getPrimaryTicketUrl` in `src/lib/data.ts`.
- Bookings is a header link to `https://bookings.tropical-nomads.com`. Its code is not in this repo.
- Some events link out to `timetable.tropical-nomads.com`. That site is not part of these tickets.
