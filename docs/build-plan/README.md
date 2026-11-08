# Build plan

Recommended order for the owner to review before any build. Each file is one ticket. Do them one at a time, in this order, unless the owner reorders them. This folder does not implement the tickets.

Settle the repository split first, keep [www.tropical-nomads.com](https://www.tropical-nomads.com) shipping on its own, then share the theme package, then write every type and schema, then stand up the web app in English and Portuguese, then the API, then accounts, then the purchase path. Phones use that web app in the browser. Payment interfaces are built now. The provider is not chosen. The three host tickets at the end of the required path are not live yet. Goabase and the native repos come after them.

The step column is the order. The file numbers are stable ids, so a ticket can sit earlier or later than its number.

Owner decisions already in this order:

- Login and registration use Amazon Cognito, with Google and Apple sign-in.
- A user profile holds identity, a billing address, an avatar, and payment methods. The payment company is listed for later and is not chosen.
- The access list has three roles. Admin creates parties and merch. Door staff only scan QR codes. Every other user sees their own purchase history and ticket history.
- The product is English and Portuguese, with internationalization. The one-pager already has both.
- The web app is its own repository. A shared repository holds theme colors, base components, types, schemas, and constants. Ticket 28 writes every schema before the feature tickets.
- Before a future go-live, and still not live: the new frontend on its own Amplify app, the API as a Docker container on ECS, and a confirmation of Amazon RDS for PostgreSQL. JSON stays the store until that confirmation. The one-pager keeps its existing Amplify deploy.
- This repository still holds the one-pager, the API, Bookings, and the JSON. Bookings is not split into its own repo.
- Email is one sender, with templates and a fixed message list. Marketing needs consent and can be stopped. No email vendor is chosen.
- Goabase is an integrations tab at the end: a list of parties that exist, so Bookings can email offers of Tropical Nomads artists. That offer uses the email ticket. The one-pager refresh stays.
- iOS and Android repositories are optional and last. Ticket 19 creates them only. It does not implement native apps.

Still open: the payment company, the currencies and prices on the payment-decisions list, and API style. Next.js stays the lean for the web app, not a lock. Languages are not open.

## Order

| Step | Ticket | Depends on | What it covers |
| --- | --- | --- | --- |
| 1 | [Identify the stack](01-identify-stack.md) | None | Cognito, Amplify, ECS, and the RDS recommendation. Leaves API style and the payment company open. |
| 2 | [Repository shape](02-repository-shape.md) | 01 | This monorepo keeps the one-pager, API, Bookings, and JSON. Shared and web repos are required. iOS and Android are named only. |
| 3 | [Deployment change](03-deployment-change.md) | 02 | www keeps its Amplify deploy. The new web app and the API do not go live. |
| 4 | [Shared client repo](04-shared-client-repo.md) | 02 | Theme, components, and the package that will hold the schemas. |
| 5 | [Types and schemas](28-types-and-schemas.md) | 04 | Every field and the lookups each feature needs, before the feature tickets. |
| 6 | [Web app repository](05-app-repos.md) | 03, 04, 28 | Required web shell, usable in a phone browser. |
| 7 | [English and Portuguese](20-internationalization.md) | 04, 05 | Internationalization. The only languages are `en` and `pt`. |
| 8 | [API reads published data](06-api-reads-published-data.md) | 02, 03, 28 | API over the JSON this repo already publishes. |
| 9 | [Shared catalog](07-shared-catalog.md) | 06, 28 | Artists, parties/events, and calendar. |
| 10 | [Upcoming events](08-upcoming-events.md) | 05, 06, 07, 20 | Capability: upcoming events. Public, no login required. |
| 11 | [Security baseline](09-security-baseline.md) | 01, 07 | Three roles: admin, door, and user. |
| 12 | [Accounts and profile](10-accounts-and-profile.md) | 04, 05, 09, 20, 28 | Cognito, Google, Apple, and the user record, in the web app. |
| 13 | [Private operational data](11-private-operational-data.md) | 06, 09, 28 | JSON for orders, tickets, check-ins, and stock, outside `public/data/`. |
| 14 | [Payment interfaces](12-payment-interfaces.md) | 09, 10, 11, 28 | Interfaces and user payment methods. This is the payment work that happens now. |
| 15 | [Payment decisions still open](21-payment-decisions.md) | 12 | Lists the later payment choices. Does not pick a provider. Nothing else waits on it. |
| 16 | [Tickets](13-tickets.md) | 08, 12, 20, 28 | Buy a ticket. The door copy is a QR code. |
| 17 | [Check-in](14-check-in.md) | 05, 10, 13, 20 | Door staff scan QR codes. They cannot configure events, tickets, or merch. |
| 18 | [Merch store](15-merch-store.md) | 05, 10, 12, 20, 28 | Buyer catalog, starting from the two shirts on the page. |
| 19 | [Purchase and ticket history](26-purchase-history.md) | 09, 10, 13, 15, 20 | A user sees only their own purchases and tickets. |
| 20 | [Inventory](16-inventory.md) | 09, 15 | Admin adds merch and sets price, sizes, and stock. |
| 21 | [Bookings package](17-bookings-package.md) | 02, 03, 07, 09, 20 | Bookings in this monorepo, own deploy, shared data. |
| 22 | [Admin party calendar](18-admin-party-calendar.md) | 07, 09, 13, 17 | Admin creates parties, sets description, image, and artists, and configures that event's tickets. |
| 23 | [Email](27-email.md) | 09, 10, 13, 14, 15, 18, 20, 28 | Sending, templates, and every product message. No vendor. |
| 24 | [Web app on Amplify](23-amplify-frontend.md) | 03, 05 | Not live yet. A separate Amplify app. www stays the one-pager. |
| 25 | [API container on ECS](24-ecs-backend.md) | 06, 23 | Not live yet. Docker on ECS. No public production API. |
| 26 | [Confirm RDS for PostgreSQL](25-rds-recommendation.md) | 01, 11, 24 | Not live yet. Recommendation to confirm. Not a migration. |
| 27 | [Goabase integrations tab](22-goabase-integrations.md) | 07, 17, 27, 28 | Last product ticket. Artist offers go through the email ticket. |
| 28 | [iOS and Android repositories](19-ios-android-repos.md) | 04 | Optional. Last. Creates the two repos only. No native screens. |

## Capabilities

| Master-plan capability | Ticket |
| --- | --- |
| Upcoming events | 08 |
| Tickets | 13 |
| Check-in | 14 |
| Payments | 12 now; 21 lists the later decisions and does not pick a provider |
| Merch store | 15 |
| Inventory | 16 |
| Abuse-resistant security | 09, then enforced on every later ticket |
| Bookings in this monorepo | 02 names the slot; 17 brings the product in |
| Admin party calendar | 18 |

English and Portuguese are decided. Ticket 20 puts them in the web app. The one-pager already has them in `src/i18n/`.

## Gaps

Checked against the decisions so far. The access list is three roles on ticket 09. Ticket 26 is the user's own history. Tickets 16 and 18 are the admin tools. Ticket 14 is the door scanner. No second role system was added.

| Decision | Where it is |
| --- | --- |
| Upcoming events | 08 |
| Tickets and QR check-in | 13 and 14 |
| Three roles | 09. Admin tools are 16 and 18. Door scan is 14. Own history is 26. |
| Payment interfaces now, provider later | 12 |
| Merch and inventory | 15 and 16 |
| Cognito with Google and Apple, profile and billing | 10 |
| Bookings deploy, shared artists, parties, calendar | 02 and 17 |
| Admin party calendar | 18 |
| Security | 09, then the later tickets that enforce it |
| English and Portuguese, with internationalization | 20. The one-pager already has `en` and `pt`. |
| JSON until a database exists | 11. Ticket 25 asks the owner to confirm RDS for PostgreSQL and does not migrate. |
| One-pager keeps deploying | 03. Tickets 23, 24, and 25 are the later hosts and are not live yet. |
| Email | 27, after parties exist and before the Goabase offer. No vendor. |
| Goabase integrations | 22, after email. The public refresh script stays. |
| Types and schemas | 28, step 5, before the web app and the feature tickets. Lookups are on the architecture indexes page. |

Order problem that this pass fixes: iOS and Android were step 5, in the same ticket as the required web shell, so the product could not move without native apps. They are now ticket 19, optional, and last. Nothing depends on them. Phones use the web app in the browser.

Not duplicates: ticket 09 writes who may scan. Ticket 14 builds the invite and the scanner. Ticket 11 is the JSON store. Ticket 01 only recommends the later database. Ticket 04 creates the shared package. Ticket 28 writes the schemas.

The three-role decision does not block the stack, the web shell, or the public event list. Those have no role tools. It is in force from ticket 09 onward. Types and schemas are step 5, before the feature tickets. History waits until tickets and merch exist, which is why it is step 19. Email is step 23, after registration, purchases, the door invite, and party creation. Goabase is step 27 and uses that sender. The catalog does not wait for either. The Amplify, ECS, and RDS tickets are steps 24–26, not live, and the build tickets before them do not wait.

Left open on purpose: the payment company and the rest of the list in ticket 21, API style, the timetable site, agenda contents, draft parties, pickup versus shipping, offline check-in, and a wallet pass. Tickets 23–25 do not create a public launch, and ticket 25 does not create a database.

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
- Every ticket enforces the three-role list from ticket 09. A denied role gets none of that ticket's tools. Security is part of the ticket, not a later pass.
- Ticket 03 is the deploy rule: client repos and the API are not published as part of the monorepo move.

## Repo facts these tickets rely on

- The site is one Vite package, name `tropical-nomads-page`, built with `pnpm build` (`tsc -b && vite build`) into `dist/`.
- There is no workspace file yet. `amplify.yml` installs and builds at the repo root and publishes `dist/`.
- Published data is `public/data/*.json`, refreshed by `scripts/fetch-goabase-events.mjs`.
- Merch stock, price, and the WhatsApp reserve link live in `src/lib/merch.ts`, not in JSON.
- Ticket buttons leave the site via `getPrimaryTicketUrl` in `src/lib/data.ts`.
- Bookings is a header link to `https://bookings.tropical-nomads.com`. Its code is not in this repo.
- Some events link out to `timetable.tropical-nomads.com`. That site is not part of these tickets.
