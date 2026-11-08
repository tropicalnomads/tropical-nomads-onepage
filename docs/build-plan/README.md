# Build plan

Recommended order for the owner to review before any build. Each file is one ticket. Do them one at a time, in this order, unless the owner reorders them. This folder does not implement the tickets.

Two iterations. The first one starts with the technical base, then adds the public product. Bookings is the second iteration, after that first product is in place. Keep [www.tropical-nomads.com](https://www.tropical-nomads.com) shipping on its own throughout. Phones use the web app in the browser. Payment interfaces are built in the first iteration. Ticket 31 is the AWS-as-code repository, with the not-live host tickets, after the RDS confirmation and before the payment company. The database scripts repository is ticket 30, after that host and before the payment company. The payment company is ticket 29, last in the first iteration. No company is named. iOS and Android stay optional, after Bookings.

The step column is the order. The file numbers are stable ids, so a ticket can sit earlier or later than its number.

Owner decisions already in this order:

- Login and registration use Amazon Cognito, with Google and Apple sign-in.
- A user profile holds identity, a billing address, an avatar, and payment methods. The payment company is ticket 29, last in the first iteration after tickets 31 and 30, and is not named.
- The access list has three roles. Admin creates parties and merch. Door staff only scan QR codes. Every other user sees their own purchase history and ticket history.
- The product is English and Portuguese, with internationalization. The one-pager already has both, and the web shell switches between them.
- The web shell is `apps/web`. The shared package is `packages/shared` at version `0.4.0`. The owner asked for both in this monorepo. The planning text described separate repositories, and those remotes were not created. Ticket 28 writes the schemas there. The shell does not invent fields. The language codes are `en` and `pt`.
- Before a future go-live, and still not live: the new frontend on its own Amplify app, the API as a Docker container on ECS, and a confirmation of Amazon RDS for PostgreSQL. Every AWS resource is in Frankfurt (`eu-central-1`). JSON stays the store until that confirmation. The one-pager keeps its existing Amplify deploy.
- AWS changes are named for a separate repository, `tropical-nomads-aws` (ticket 31). Every change is one versioned file, committed, and deployed from that commit. The owner asked for that repository. It is named here and not created. The first resources are Amazon Cognito with Google and Apple, and Amazon RDS for PostgreSQL in Frankfurt. They are not created. Multi-AZ is out of scope. JSON stays the store until that database is confirmed. The one-pager keeps deploying. The new app does not go live. The files hold no passwords, provider secrets, account ids, or connection strings.
- This repository still holds the one-pager, the API, Bookings, and the JSON. Bookings is not split into its own repo.
- Migration scripts and seed scripts are named for a separate repository, `tropical-nomads-database` (ticket 30). The seeds are for unit tests, automation tests, and similar uses. The owner asked for that repository. It is named here and not created. Amazon RDS for PostgreSQL in Frankfurt stays the recommendation. JSON stays the store until that database is confirmed. Seeds stay synthetic, and the scripts hold no passwords, ticket secrets, card numbers, or connection strings.
- Email is one sender, with templates and a fixed message list. Marketing needs consent and can be stopped. No email vendor is chosen.
- The first iteration is the technical base, then the public product: upcoming events, accounts, payments, tickets, check-in, merch, history, inventory, and email. It reads parties that are already in the published JSON.
- Bookings is the second iteration: the Bookings package, the admin party calendar, and the Goabase integrations tab. The first product does not wait for them.
- Goabase in that second iteration is a list of parties that exist, so Bookings can email offers of Tropical Nomads artists. That offer uses the email ticket. The one-pager refresh stays.
- iOS and Android repositories are optional and last. Ticket 19 creates them only. It does not implement native apps.
- DevOps is a person on the building team. They own the AWS sizes and hold the AWS skills. They are not a product role. Signed-in people stay admin, door, or user.
- Traffic to size for: about five admins, and parties of about 100–200 people. The starting sizes are in [the AWS record](../devops/aws.md). Nothing there is created yet.

The API is REST, served by Hono. The currency is euro. Next.js is installed in `apps/web` and is not the one-pager. Languages are not open. The payment company is not named.

## Why this order

The technical base comes first because every later ticket sits on it: the repo split, the shared package, the schemas and lookups, the web shell, both languages, the API read path, the three roles, and the private store. Product screens before that base would invent their own shapes.

The public product comes next, still in the first iteration. People can see the parties already in the published JSON, register, pay through the interfaces, hold a ticket, get checked in, buy a shirt, see their own history, and receive the email for those actions. Creating parties in a Bookings calendar is not required for that. The one-pager already has the events.

Bookings is the second iteration: bring the existing Bookings product into this repo, then the admin calendar that creates parties and agendas, then the integrations tab that offers artists to outside parties. The first iteration does not wait on any of those.

The Amplify, ECS, and RDS tickets are the deploy path for the first product, and they are not live. Ticket 31 is with those hosts. It names `tropical-nomads-aws`, where every AWS change is one versioned file, committed, and deployed from that commit. Cognito with Google and Apple, and RDS for PostgreSQL in Frankfurt, are the first resources. They are not created. Multi-AZ is out of scope. JSON stays the store. www keeps deploying, and the new app does not go live. Ticket 30 comes next. It is the separate repository for migration scripts and for seeds used by unit tests, automation tests, and similar uses. The index keeps it there: ticket 25 confirms RDS and does not migrate, earlier tests still use JSON and the schemas, and the scripts ticket does not pick a new database. The payment-company ticket stays last in that iteration, after tickets 31 and 30, and it does not name a company. Bookings does not wait for the hosts, the scripts repository, or the company.

## Order

| Step | Iteration | Ticket | Depends on | What it covers |
| --- | --- | --- | --- | --- |
| 1 | 1, base | [Identify the stack](01-identify-stack.md) | None | Cognito, Next.js, Amplify, ECS, REST, and the RDS recommendation. Region is Frankfurt. |
| 2 | 1, base | [Repository shape](02-repository-shape.md) | 01 | This monorepo keeps the one-pager, API, and Bookings. Turborepo and pnpm. Client repos are named only. |
| 3 | 1, base | [Deployment change](03-deployment-change.md) | 02 | www publishes only `apps/one-pager`. The new web app and the API do not go live. |
| 4 | 1, base | [Shared client repo](04-shared-client-repo.md) | 02 | `packages/shared` at version 0.1.0. Theme, component contract, and the empty schema entry. |
| 5 | 1, base | [Types and schemas](28-types-and-schemas.md) | 04 | Record schemas and lookups in `packages/shared`. No database. |
| 6 | 1, base | [Web app repository](05-app-repos.md) | 03, 04, 28 | `apps/web` shell, usable in a phone browser. Not deployed. Schema fields stay in ticket 28. |
| 7 | 1, base | [English and Portuguese](20-internationalization.md) | 04, 05 | The web shell switches between `en` and `pt`. No third language. |
| 8 | 1, base | [API reads published data](06-api-reads-published-data.md) | 02, 03, 28 | Local Hono read of the published JSON. No public host. |
| 9 | 1, base | [Shared catalog](07-shared-catalog.md) | 06, 28 | Every published party and artist. No agenda and no draft filter. |
| 10 | 1, base | [Security baseline](09-security-baseline.md) | 01, 07 | Admin, door, and user. No fourth role. |
| 11 | 1, base | [Private operational data](11-private-operational-data.md) | 06, 09, 28 | Empty private JSON in `data/operational`. No database. The lock waits. |
| 12 | 1, product | [Upcoming events](08-upcoming-events.md) | 05, 06, 07, 20 | Public list in the web app. Outbound ticket links. No payment. |
| 13 | 1, product | [Accounts and profile](10-accounts-and-profile.md) | 04, 05, 09, 20, 28 | Profile rules and sign-in screens. Cognito is not called. |
| 14 | 1, product | [Payment interfaces](12-payment-interfaces.md) | 09, 10, 11, 28 | Pending traces and saved methods. No company and no confirmed charge. |
| 15 | 1, product | [Payment decisions still open](21-payment-decisions.md) | 12 | Later payment questions. Euro and no refunds are already decided. The company is ticket 29. |
| 16 | 1, product | [Tickets](13-tickets.md) | 08, 12, 20, 28 | Buy a ticket for a published party. The door copy is a QR code. |
| 17 | 1, product | [Check-in](14-check-in.md) | 05, 10, 13, 20 | Door staff scan QR codes. They cannot configure events, tickets, or merch. |
| 18 | 1, product | [Merch store](15-merch-store.md) | 05, 10, 12, 20, 28 | Buyer catalog, starting from the two shirts on the page. |
| 19 | 1, product | [Purchase and ticket history](26-purchase-history.md) | 09, 10, 13, 15, 20 | A user sees only their own purchases and tickets. |
| 20 | 1, product | [Inventory](16-inventory.md) | 09, 15 | Admin adds merch and sets price, sizes, and stock. |
| 21 | 1, product | [Email](27-email.md) | 09, 10, 13, 14, 15, 20, 28 | Sending, templates, and every product message. No vendor. |
| 22 | 1, host | [Web app on Amplify](23-amplify-frontend.md) | 03, 05 | Not live yet. A separate Amplify app. www stays the one-pager. |
| 23 | 1, host | [API container on ECS](24-ecs-backend.md) | 06, 23 | Not live yet. Docker on ECS. No public production API. |
| 24 | 1, host | [Confirm RDS for PostgreSQL](25-rds-recommendation.md) | 01, 11, 24 | Not live yet. Recommendation to confirm. Starting size is `db.t4g.small` in the AWS record. Not a migration. |
| 25 | 1, host | [AWS as code repository](31-aws-as-code.md) | 01, 03, 09, 25 | Not live yet. Separate repo. One versioned file per resource, deployed from that commit. Cognito and RDS are named and not created. www keeps deploying. |
| 26 | 1, data | [Database scripts repository](30-database-scripts.md) | 01, 11, 25, 28 | Separate repo for migrations and test seeds. Not created. RDS for PostgreSQL in Frankfurt stays the recommendation. JSON stays the store. |
| 27 | 1, last | [Choose the payment company](29-payment-company.md) | 12, 23, 24, 25, 31 | Last in iteration 1, after tickets 31 and 30. Does not name a company. |
| 28 | 2, Bookings | [Bookings package](17-bookings-package.md) | 02, 03, 07, 09, 20 | Second iteration. Bookings in this monorepo, own deploy, shared data. |
| 29 | 2, Bookings | [Admin party calendar](18-admin-party-calendar.md) | 07, 09, 13, 17, 27 | Admin creates parties and configures that event's tickets. |
| 30 | 2, Bookings | [Goabase integrations tab](22-goabase-integrations.md) | 07, 17, 27, 28 | Outside parties, so Bookings can email artist offers. |
| 31 | Later | [iOS and Android repositories](19-ios-android-repos.md) | 04 | Optional. Last. Creates the two repos only. No native screens. |

## Capabilities

| Master-plan capability | Ticket |
| --- | --- |
| Upcoming events | 08 |
| Tickets | 13 |
| Check-in | 14 |
| Payments | 12 now. 21 lists later questions. 29 is the company, last in iteration 1, and does not name one. |
| Merch store | 15 |
| Inventory | 16 |
| Abuse-resistant security | 09, then enforced on every later ticket |
| Bookings in this monorepo | 02 names the slot in the base. 17 brings the product in, in the second iteration. |
| Admin party calendar | 18, second iteration |

English and Portuguese are decided. The web shell switches between them. The one-pager already has them in `src/i18n/`.

## Gaps

Checked against the decisions so far. The access list is three roles on ticket 09. Ticket 26 is the user's own history. Tickets 16 and 18 are the admin tools. Ticket 14 is the door scanner. No second role system was added.

| Decision | Where it is |
| --- | --- |
| Upcoming events | 08 |
| Tickets and QR check-in | 13 and 14 |
| Three roles | 09. Admin tools are 16 and 18. Door scan is 14. Own history is 26. |
| Payment interfaces now, company last | 12 now. 29 is last in iteration 1 and does not name a company. |
| Merch and inventory | 15 and 16 |
| Cognito with Google and Apple, profile and billing | 10 |
| Bookings deploy, shared artists, parties, calendar | 02 names the slot. 17, 18, and 22 are the second iteration. |
| Admin party calendar | 18, after the first product |
| Security | 09, then the later tickets that enforce it. Ticket 31 keeps passwords, provider secrets, account ids, and connection strings out of the AWS repository, and it does not open the database. Ticket 30 requires synthetic seeds and keeps passwords, ticket secrets, card numbers, and connection strings out of the scripts repository. |
| English and Portuguese, with internationalization | 20. The one-pager and the web shell use `en` and `pt`. |
| JSON until a database exists | 11. Ticket 25 asks the owner to confirm RDS for PostgreSQL and does not migrate. Ticket 31 names the AWS repository and does not create the database. Ticket 30 names the scripts repository and does not create it. Starting sizes are in [the AWS record](../devops/aws.md). |
| AWS as code repository | 31, step 25, with the not-live hosts, after ticket 25 and before tickets 30 and 29. Named `tropical-nomads-aws`. The owner asked for it. One versioned file per resource, deployed from that commit. Cognito with Google and Apple, and RDS for PostgreSQL in Frankfurt, are named and not created. Multi-AZ is out of scope. |
| Database scripts repository | 30, step 26, after ticket 25 and ticket 31, and before ticket 29. Named `tropical-nomads-database`. The owner asked for it. Seeds are for unit tests, automation tests, and similar uses, and they stay synthetic. RDS for PostgreSQL in Frankfurt stays the recommendation. |
| One-pager keeps deploying | 03. Tickets 23, 24, 25, and 31 are the later hosts and are not live yet. Region is Frankfurt (`eu-central-1`). |
| Email | 27, in the first product, after purchases and the door invite. No vendor. |
| Goabase integrations | 22, in the second iteration with Bookings. The public refresh script stays. |
| Types and schemas | 28, step 5. Schemas and lookups are in `packages/shared`. The shell does not invent fields. |

Order problem that this pass fixes: iOS and Android were step 5, in the same ticket as the required web shell, so the product could not move without native apps. They are now ticket 19, optional, and last. Nothing depends on them. Phones use the web app in the browser.

Not duplicates: ticket 09 writes who may scan. Ticket 14 builds the invite and the scanner. Ticket 11 is the JSON store. Ticket 01 only recommends the later database. Ticket 04 creates the shared package. Ticket 28 writes the schemas. Ticket 25 confirms that recommendation and does not migrate. Ticket 31 names the repository for AWS resource files. It does not create the repository, Cognito, or RDS, and it does not replace tickets 23, 24, or 25. Ticket 30 names the repository for migration scripts and test seeds. It does not create the repository, and it does not replace ticket 25.

The three-role decision does not block the stack, the web shell, or the public event list. Those have no role tools. It is in force from ticket 09 onward. Types and schemas are step 5, before the feature tickets, and they include the Bookings records so the second iteration does not invent fields. History is step 19, after tickets and merch. Email is step 21, still in the first product. The Amplify, ECS, and RDS tickets are steps 22–24, not live. The AWS-as-code repository is step 25, with those hosts. The database scripts repository is step 26. The payment company is step 27 and is not named. Bookings is steps 28–30. iOS and Android are step 31. The catalog and the public product do not wait for Bookings.

Left open on purpose: the timetable site and agenda contents. Ticket 21 lists later payment questions and does not name a company. Tickets 23–25 and ticket 31 do not create a public launch, and ticket 25 does not create a database. Ticket 31 does not create a repository, call AWS, or create Cognito or RDS. Multi-AZ stays out of scope. Ticket 30 does not create a repository, a database, or a migration. Ticket 29 is the company choice and does not name one. Starting AWS sizes are in [the AWS record](../devops/aws.md). DevOps owns later changes.

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

- The site is one Vite package, `apps/one-pager`, name `tropical-nomads-page`, built with `pnpm build` (`tsc -b && vite build`) into `apps/one-pager/dist/`.
- Package manager commands use pnpm. The lockfile is at the repo root. `amplify.yml` installs there and publishes `apps/one-pager/dist`.
- The monorepo uses Turborepo (`turbo.json`) and a pnpm workspace (`pnpm-workspace.yaml`).
- Published data is `apps/one-pager/public/data/*.json`, refreshed by `apps/one-pager/scripts/fetch-goabase-events.mjs`.
- Operational JSON is `data/operational`. It is empty and it is not published.
- Merch stock, price, and the WhatsApp reserve link live in `apps/one-pager/src/lib/merch.ts`, not in JSON.
- Ticket buttons leave the site via `getPrimaryTicketUrl` in `apps/one-pager/src/lib/data.ts`.
- Bookings is a header link to `https://bookings.tropical-nomads.com`. Its code is not in this repo.
- Some events link out to `timetable.tropical-nomads.com`. That site is not part of these tickets.
