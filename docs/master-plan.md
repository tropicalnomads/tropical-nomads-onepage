# Tropical Nomads — product plan

**Status:** planning only.
**Date:** 6 November 2026.
**Owner:** Júlio Locatelli Piva.
**Repository:** this one-pager repository, `tropical-nomads-onepage`.

This plan describes the product and the later shape of the repository. It does not implement the product, add packages, or choose vendors. The one-pager keeps its current behavior.

Read it with the [documentation index](README.md) and the [architecture pages](architecture/README.md).

## 1. The product, in plain words

Tropical Nomads already has a public website at [www.tropical-nomads.com](https://www.tropical-nomads.com) and a Bookings product at [bookings.tropical-nomads.com](https://bookings.tropical-nomads.com). The aim is one product family built from those: a website and an application, with Bookings in the same codebase.

A person can see the next events, buy a ticket, receive a ticket the product generated, and check that ticket in at the event. The product takes payment for those tickets. It also sells merchandise — T-shirts and other products — and it keeps stock under control.

Bookings stays on its own address. Its code moves into this repository, it deploys separately, and it shares artists, parties and events, and the calendar with the website and app. In Bookings admin, a party calendar is how the team builds each artist's agenda.

Abuse and fraud resistance is part of the product from the start, beside the visible features.

Any sentence in this section is open to correction by the owner. A correction here wins over the detail below.

### What this repository does today

These are facts about the current one-pager, so the restatement stays honest. They are facts about the page, and they are not decisions about the future product.

- The site lists upcoming events and past events from JSON under `public/data/`. `scripts/fetch-goabase-events.mjs` refreshes events from Goabase.
- A ticket button sends the visitor to an external link on the event (Eventbrite, another tickets URL, or Goabase). The site does not sell the ticket itself.
- Some events link out to a timetable at `timetable.tropical-nomads.com`.
- The shop shows two T-shirts at €50, with pickup described as The Sound House in Dublin. Reserving opens WhatsApp. Size counts live in `src/lib/merch.ts`.
- The page has English and Portuguese copy.
- The build includes a PWA plugin. `amplify.yml` builds this static site.
- Bookings is a separate product on its own host. Its code is not in this repository.
- Partners, venues, artists, labels, and agencies already exist as data the page can show.

### Waiting until the owner asks to build

- Implementing or scaffolding the app, the API, or a monorepo layout.
- Adding dependencies, or changing how the one-pager behaves.
- Choosing a payment company. That choice is ticket 29, last in the first iteration. This plan does not name a company, and it does not install a provider or create cloud resources.
- The first build step in section 8.

## 2. The nine capabilities

Each item below is in the product. The plan keeps all nine.

### 2.1 Upcoming events

People can see the next events: what, when, and where, with the lineup and partner context the page already cares about. The list is the front door to tickets. A party edited on the admin calendar and a party shown on the public list are the same record.

### 2.2 Tickets

A visitor can buy a ticket for an event, and the product generates that ticket. The purchase-to-ticket flow is: choose the event, pay, receive a ticket the product created, find that ticket again later, and present it for check-in. The ticket is tied to that purchase. The door scans a QR code. Ticket types stay open. A wallet pass is later, and it is not in this iteration (section 7).

### 2.3 Check-in

The application has an area for checking in tickets that were purchased. An admin invites the people who scan QR codes at the door. Check-in accepts a genuine ticket for the right event and records the result. Section 4 describes the flow.

### 2.4 Payments

Ticket purchases are paid, and the product keeps a trace of what was paid: who, how much, which tickets, and the status. The payment interfaces, including a place for the user's payment methods, come first. Connecting a provider comes later. The same interfaces cover merch.

### 2.5 Merch store

The product sells T-shirts and other merchandise. Today's page shows two shirts and a WhatsApp reservation. The product store is a catalog a customer can buy from. Tickets and merch share payment interfaces. Connecting a provider comes later. Which other products exist stays open. Merch is pickup for now. Shipping is later.

### 2.6 Inventory

Stock is controlled. A real sale changes the count. The team can see and correct stock. The public store shows availability that matches those counts. Today's counts are constants in `src/lib/merch.ts`. In the product, stock is data, held as JSON until a database is chosen (section 5, and the architecture notes).

### 2.7 Abuse-resistant security

Security is a capability that runs through the others. It is not a page. Signed-in people have one of three roles: admin, door, or user. Tickets are hard to forge. Only door staff scan QR codes. Payments leave a trace. Section 6 states the outcomes. Those outcomes are goals for the new product. They are not an audit of the current websites.

### 2.8 Bookings in this monorepo

Tropical Nomads Bookings lives in this repository, deploys on its own, and stays at `bookings.tropical-nomads.com`. It shares artists, parties and events, and the calendar with the website and app. Both products read and write that shared data. Section 5 and the [architecture notes](architecture/monorepo-and-data.md) describe how one repository supports that separate deploy.

### 2.9 Admin party calendar

The admin role has a calendar of parties and festivals. An admin creates a party and sets its description, image, and artists, and configures that event's tickets. The same calendar is where agendas are assembled. Those parties are the same parties the public site can list. What an agenda contains, beyond an artist and the parties they play, is undecided.

## 3. How the areas connect

```
Upcoming events  →  Tickets  →  Payments  →  Issued ticket  →  Check-in

Merch store      →  Inventory  →  same payment interfaces, provider later

Bookings admin   →  Party calendar  →  Artist agendas
        \                                  /
         \---- shared artists, parties/events, calendar
```

- **Events feed tickets.** An event can be listed with nothing for sale. An event that sells tickets opens the purchase flow.
- **Tickets go with payment.** The product issues the ticket when that order's payment is complete. What "complete" means depends on the provider, which is undecided. The order and the payment trace stay together.
- **Check-in uses the issued ticket.** Check-in does not create a ticket and does not take payment.
- **Merch and inventory are a pair.** The store sells what inventory says is available. Inventory owns the count.
- **Merch uses the same payment interfaces as tickets.** Connecting the provider comes later. Merch is pickup for now. Shipping is later.
- **Bookings and the public product share artists, parties/events, and the calendar.** Both products read and write those records. The admin party calendar is where agendas are assembled. Visitors see the published parties. A public lineup and an agenda in Bookings are two views of the same data.
- **Security sits on every arrow.** A person with no account can read published events. Admin writes parties, ticket offers, and merch. Door staff only record a check-in. A user reads their own purchases and tickets.

### Information architecture

Areas the product needs. The names describe the job. They are not screen titles, and they are not a build order.

| Area | Who uses it | What it is for |
| --- | --- | --- |
| Public events | Visitor, buyer | Upcoming events, and enough detail to decide to go |
| Ticket purchase | Buyer | Choose tickets, pay, receive the generated ticket |
| My purchases and tickets | User | See that person's own purchase history and ticket history |
| Check-in | Door | Scan a QR code and record the result. No event, ticket, or merch configuration |
| Merch store | User | Browse T-shirts and other products, and buy what is in stock |
| Merch admin | Admin | Add merch and set price, sizes, and stock |
| Party calendar | Admin | Create parties, set description, image, and artists, configure that event's tickets, and build agendas |
| Shared catalog | Website/app and Bookings, both reading and writing; visitors see the published view | Artists, parties/events, calendar |

A user returns to their own purchases and tickets after they sign in. Registration uses Cognito, with Google and Apple, and starts as the user role.

Admin is one role for parties and merch. Door is one role for the scanner. The jobs stay in different screens so a door session is not also the party editor.

## 4. Main flows

The paths below are what to design against. Open choices stay open.

### Visitor

1. Open the public site.
2. See the upcoming events.
3. Open an event and read when, where, and who is playing.
4. Leave, start a ticket purchase, or browse merch.
5. A visitor does not see other people's tickets, inventory controls, the party-calendar editor, or payment traces.

Today the ticket step leaves the site through an external link. In the product, that step continues in the buyer flow below.

### Ticket buyer

1. From an event, choose what to buy. The currency is euro. Ticket types and the price list stay open.
2. Confirm the order and pay through the provider chosen later.
3. The product generates the ticket and gives it to the buyer.
4. The buyer can open that ticket again and see what was paid.
5. At the event, check-in validates that ticket.
6. The buyer does not set the price and does not invent a ticket. Check-in is done by people the admin invites, not by the buyer.

### Door / check-in staff

The owner decided this on 8 November 2026. An admin invites people to help at the door. Those people scan the buyer's QR code. A buyer does not check themselves in.

1. Open the check-in area, for an event this role is allowed to handle.
2. Scan the QR code on the buyer's ticket.
3. The product checks that the ticket was issued, matches this event, matches a real payment, and is still valid under the rules. Re-entry and transfers are undecided.
4. The product records the check-in: which ticket, which event, when, and who performed it.
5. A refused check-in (unknown, unpaid, wrong event, or already used when the rules say so) is visible to this role, and the holder is not admitted.
6. This role does not create a party, configure tickets, add merch, or change price, sizes, or stock.

### Merch customer

1. Open the store and see T-shirts and any other products on sale.
2. See which sizes or variants are available. The count comes from inventory.
3. Buy or reserve. Merch is pickup for now. Shipping is later. The current page reserves by WhatsApp and names a Dublin pickup.
4. A completed sale reduces stock, so two customers cannot take the last piece.
5. The customer does not edit counts.

### Admin

Admin is one role. There are no refunds. Guest tickets and the other money rules that are not refunds stay open.

1. Sign in as admin.
2. Create a party. Set its description, image, and artists.
3. Configure that event's ticket offers.
4. Add merch. Set its price, sizes, and stock.
5. Invite door staff, and revoke the invite.
6. Save parties through the shared catalog, so the public list and Bookings use the same records. A party can be a draft and stay off the public list. A draft is not readable on the public site (section 7).
7. This role does not scan QR codes.

### User

1. Sign in. The account is the user role unless an admin has changed it.
2. Buy a ticket or a shirt through the purchase flow.
3. Open purchase history and ticket history. Only this account's rows are there.
4. This role does not open the party editor, the merch editor, or the scanner.

## 5. Repository shape

The [architecture index](architecture/README.md) holds the detail: the [system diagram](architecture/system.md), the [model diagram](architecture/models.md), and the [monorepo notes](architecture/monorepo-and-data.md). What is already settled:

- Later work stays in **this** repository. There is no new unrelated repository.
- This repository is a **monorepo**. It uses **Turborepo** and **pnpm**. The one-pager package is `apps/one-pager`. The API slot is `apps/api`. The Bookings slot is `apps/bookings`. Operational JSON is `data/operational`, outside `public/`.
- Package manager commands use **pnpm**. The current one-pager already uses pnpm: `pnpm-lock.yaml`, `amplify.yml`, `pnpm install`, `pnpm lint`, and `pnpm build`.
- The **current one-pager stays as one package** inside that monorepo.
- The **API package** is added later, in this same repository.
- The **web app is its own repository**, plus a shared repository for theme colors, base components, types, schemas, and constants. Phones use that web app in the browser. iOS and Android repositories are optional and last, and they only create the repos. They call the API. They do not keep a copy of the event data.
- **Bookings** is a package in the same monorepo, with its **own deploy**, still at `bookings.tropical-nomads.com`.
- **Shared data** is artists, parties/events, and the calendar. The website/app and Bookings both read and write it.
- The data store is **JSON files until the database recommendation is confirmed**. The recommendation is Amazon RDS for PostgreSQL. It is not a migration, and no database is created by this plan.
- One repository can carry this. Bookings can have its own deploy without its own repository. A split into unrelated repositories is not the plan. The architecture note says why the monorepo holds.

### How the pieces relate

| Piece | Role | Deploy |
| --- | --- | --- |
| One-pager package | The current site, kept as its own package | Its existing Amplify app, at www. It keeps deploying. |
| Web app repo, plus a shared repo | The product people use, including on a phone browser. Shared repo holds theme, components, types, schemas, and constants. | Later host is a separate Amplify app. It does not go live in the current tickets. |
| iOS and Android repos | Optional. Create the repositories only. | Last in the build plan. No native implementation. |
| API package | Reads and writes JSON for both products | Later host is a Docker container on ECS. It does not go live in the current tickets. |
| Bookings package | Bookings, including the admin party calendar | `bookings.tropical-nomads.com` |
| JSON data | Shared records, and a separate set of operational records | The files are the store until RDS for PostgreSQL is confirmed. They are not a third website. |

Operational records — tickets, payment traces, check-ins, and live stock — are JSON too, until a database exists. They are a different set of files from the public event JSON the site already ships. Publishing ticket secrets under `public/data/` would make them world-readable, which section 6 rules out.

## 6. Security and anti-abuse

These are the outcomes the product is designed for. They describe the future product. They are not a claim about the current websites, and they are not an implementation guide.

### People and permissions

Signed-in accounts have one of three roles.

- **Admin** creates parties and sets the description, image, and artists. Admin configures that event's tickets. Admin adds merch and sets price, sizes, and stock. Admin invites and removes door staff.
- **Door** checks people in by scanning a QR code for an invited event. Door cannot configure events, tickets, or merch.
- **User** sees their own purchase history and their own ticket history, and can buy. A user cannot open admin tools or the door scanner.

A person with no account can read published events and the public store. That is not a fourth role. One account has one role, so a door session is not also the party editor.

DevOps is a person on the building team. They choose instance sizes and hold the AWS skills. They are not a signed-in role.

Sign-in is Amazon Cognito, with Google and Apple as the SSO providers. New accounts are users. The three roles are the rule Cognito groups and the API have to meet. Security is a requirement on every ticket.

### Tickets

- The product issues a ticket. An image a buyer made, or a copied event id, is not a ticket.
- The value presented at the door is unguessable, and it is stored with the issued ticket. It is absent from the public event JSON.
- Check-in asks the product whether the ticket is real. The client's claim is not the check.
- A ticket belongs to a purchase and an event. Presenting it for a different event fails.
- The product records each check-in and its result. Transfer, re-entry, and a second scan are undecided rules. The record exists so those rules can be applied once they are chosen. A refused ticket does not admit the holder.
- Guest tickets and free tickets, if they exist later, are still issued by the product and still leave a trace.

### Check-in

- Only the door role can record a check-in.
- A recorded attempt names the ticket, the event, the time, and who performed it.
- A run of invalid attempts is a fraud signal the product should be able to slow down. The thresholds belong to implementation, after the stack is chosen.
- Offline check-in is later, and it is not in this iteration. Any later offline mode still syncs into the same check-in record, so two doors cannot both accept one ticket with the product unaware.

### Payments

- Every ticket charge has a trace: buyer, amount, currency, tickets covered, status, time, and the provider's reference.
- The browser does not declare that a payment succeeded. The status changes when the provider confirms it.
- The product stores the payment trace. Raw card numbers stay out of Tropical Nomads' own data.
- The amount on the trace is the amount charged. A later price edit does not rewrite a past charge.
- A ticket is issued for a payment the product considers complete. A ticket with no confirmed payment is the case this capability is here to prevent.
- There are no refunds. This product does not record a refund or let a refunded ticket check in, because a refund does not exist. Chargebacks stay open.

### Admin access

- Party, ticket-offer, merch, and stock writes are admin actions. The public site reads the published result.
- A completed merch sale also moves stock. That movement is not a door or user edit.
- An admin action that changes money, tickets, or stock records who did it.

### Public files and private files

- Files shipped with the public site are readable by anyone. They can hold published events, artists, venues, partners, and public product info.
- They stay clear of ticket secrets, payment traces, check-in records, admin-only notes, and credentials.
- The store can show "available" or "sold out" without publishing the team's full stock history.
- Both deploys write through the API's control of the JSON. A visitor on the marketing site cannot edit a party by fetching a file.

## 7. Open questions

Status is per row. The stack decision below is dated 8 November 2026. Everything it names is decided. Everything else stays open.

### Stack decision record

Dated 8 November 2026. Ticket 1 writes this record. It does not install a package, connect to AWS, create a cloud resource, or launch the new app. The one-pager stays the Vite site on its current Amplify app. Passwords stay in Amazon Cognito. This product does not store them.

The owner defined the architecture.

| Topic | Decision |
| --- | --- |
| Registration and login | Amazon Cognito, with Google and Apple. An Apple Services ID and a Google OAuth client are later work in ticket 10. They are not created here. |
| Web app | Next.js. It is not installed here, and `src/` is not rewritten. |
| Web frontend host | Amplify, when a later ticket is allowed to launch. A separate app from the one-pager. |
| API host | A Docker container on ECS, when a later ticket is allowed to launch. The cluster is not created here. |
| API style | REST. |
| Phones | The web app in the browser. |
| Repositories | A shared repo and a web app repo are required. iOS and Android repos are optional and last. Ticket 19 may create them. It does not implement native apps. This monorepo keeps the one-pager, the API, Bookings, and JSON. The monorepo uses Turborepo and pnpm. The one-pager package is `apps/one-pager`. The shared repo does not wait on a native component toolkit. |
| Package manager | pnpm. The one-pager already uses it. |
| Languages | English and Portuguese. |
| Database | Amazon RDS for PostgreSQL is the recommendation. JSON stays the store until that database is confirmed. This ticket does not create it and does not migrate. The starting size is in [the AWS record](devops/aws.md): one `db.t4g.small`. |
| Region | Every AWS resource is in Frankfurt (`eu-central-1`). None are created here. |
| DevOps | A person on the building team. They own the AWS sizes and hold the AWS skills. They are not a fourth product role. |
| Traffic | About five admins. A party is about 100–200 people. The audience is small. The sizes for that audience are in [the AWS record](devops/aws.md). |
| Payment company | Chosen in ticket 29, last in the first iteration, after the not-live hosts. No company is named. |
| Currency | Euro only, for now. |
| Merch | Pickup for now. Shipping is later. |
| Refunds | There are no refunds. |
| Draft parties | A party can be a draft. A draft stays off the public list and is not readable by a visitor. |
| Offline check-in | Later. Not in this iteration. |
| Wallet pass | Later. Not in this iteration. |

Still open: ticket types, comps, guest lists, chargebacks, cancellation, transfers, re-entry, which products exist beyond T-shirts, and what an agenda contains.

### Named by the owner

| Topic | Status | What stays attached to the question |
| --- | --- | --- |
| Tech stack | Decided | The record above. Cognito with Google and Apple. Next.js for the web app, not installed here. Amplify for the new frontend. A Docker container on ECS for the API. REST. RDS for PostgreSQL is the recommendation. JSON stays until that database is confirmed. The new app is not launched. |
| Cloud vendor | Decided as a target | AWS is the platform, in Frankfurt (`eu-central-1`). The one-pager keeps its Amplify app. The new web app's Amplify app and the ECS cluster are not created here. Starting sizes are in [the AWS record](devops/aws.md). DevOps owns later changes. |
| Payments provider | Chosen later | Ticket 29, last in the first iteration, after the not-live hosts. The company is not named. The currency is euro. There are no refunds. |
| Ticket format | Decided for this iteration | Door staff scan a QR code. A wallet pass is later, and it is not in this iteration. |
| Where the apps live | Decided | The web app and a shared repository are required. iOS and Android repositories are optional, last, and are not a native implementation. Phones use the web app in the browser. This repo still holds the one-pager, the API, Bookings, and the JSON data. The monorepo uses Turborepo. Commands use pnpm. The packages are `apps/one-pager`, `apps/api`, and `apps/bookings`. |
| Who performs check-in | Decided | The access list has three roles. Door staff scan QR codes. Admins and users do not. Offline check-in is later, and it is not in this iteration. |
| Languages | Decided | The product is English and Portuguese, with internationalization. The one-pager already has both in `src/i18n/`. The currency is euro. |
| Email | Decided | One sender and a fixed message list. A ticket purchase email carries the QR code. Marketing for a new party, and the artist offer, need consent, a stated purpose, and a way to stop. Stopping marketing does not stop purchase or QR mail. No email vendor is chosen. |
| Data model | Decided as a picture | Records and fields are in the architecture models page, on tag `product-plan-v1`. Ticket 28 writes the schemas before the feature tickets. A party can be a draft, and a draft is not public. |
| Implementation order | Proposed for review | The first iteration is the technical base, then the public product, then the not-live host tickets, then the payment-company ticket. Bookings is the second iteration. The order is in [docs/build-plan/](build-plan/README.md). |

### Also undecided, and needed before implementation

- Ticket types, comps, guest lists, chargebacks, and cancellation. Transfers and re-entry stay with check-in. The currency is euro, and there are no refunds.
- Which products exist beyond T-shirts. Merch is pickup for now. Shipping is later. Today's page describes a WhatsApp reservation and pickup at The Sound House, Dublin.
- What an artist agenda contains, and how much of it the public site shows.
- Whether `timetable.tropical-nomads.com` remains a separate surface. This plan leaves it where it is.
- Goabase's new job is decided: an integrations tab in the second iteration, with Bookings, holding parties that exist so Bookings can email offers of Tropical Nomads artists. The one-pager refresh script stays until that ticket. It does not block the catalog or the first product.
- A team view of every customer's orders. Users see their own history. That does not add a fourth role.
- Where writable JSON lives — in git, or in a private location the API updates — and how two deploys avoid overwriting the same file. The store is JSON until the owner confirms Amazon RDS for PostgreSQL.
- The one-pager keeps its own Amplify deploy at www. Before a future go-live, and still not live: a separate Amplify app for the web frontend, a Docker container on ECS for the API, and a confirmation of Amazon RDS for PostgreSQL. None of those three is a public launch, and the database ticket is not a migration.

## 8. What to decide first

This is a planning sequence. It is the order of decisions. It is not a build schedule, and it is not the order to write code.

1. **Confirm the restatement** in section 1, including all nine capabilities, and the boundary with today's one-pager, Bookings, and the timetable site.
2. **The actors are named.** Signed-in people are admin, door, or user. Admin invites door staff. A user sees their own history. DevOps is on the building team and is not a signed-in role.
3. **The shared records are sketched** in the plan on tag `product-plan-v1`. A party can be a draft, and a draft is not on the public list. What an agenda contains stays open.
4. **Ticket and payment outcomes.** The buyer receives a QR code in this iteration. There are no refunds. The currency is euro. Transfer, re-entry, and comps stay open. The payment company is ticket 29, after the not-live hosts, and it is not named.
5. **Merch is pickup for now.** Shipping is later. Stock moves when a sale is real. Whether a shirt is paid inside this product waits on the payment company.
6. **Split public JSON from private JSON,** including where writable files live. Do this before API work, so ticket secrets stay out of the public site bundle.
7. **Languages are chosen.** The product is English and Portuguese, with internationalization. Countries are still open. The currency is euro.
8. **Build shared UI components for the web app.** Theme tokens, types, schemas, and constants live in the shared repo. Native screens are not in the required path, so a Swift or Kotlin component toolkit is not a blocker.
9. **The architecture is defined.** Cognito with Google and Apple, Next.js, Amplify, a Docker container on ECS, REST, and Amazon RDS for PostgreSQL as the recommendation. Every AWS resource is in Frankfurt (`eu-central-1`). Those hosts are not live yet. The one-pager deploy stays. The payment company is ticket 29 and is not named. JSON stays the store until the database is confirmed. Starting sizes for about five admins and parties of about 100–200 people are in [the AWS record](devops/aws.md).
10. **Set the remaining implementation order** after those decisions. One constraint is already fixed. It sits below, separate from this list, so it is not mistaken for a full build plan.

### Later build constraint

When the owner explicitly asks to start building, the **first build step** is to turn the Tropical Nomads page into a web app that can have an API.

That step adds the API package beside the current one-pager, and a web app repository that can call it. JSON files are the data store. The [build plan](build-plan/README.md) splits that step, and everything after it, into tickets for review. This plan still does not build them.

## 9. How this folder grows

- Product decisions and open questions stay in `docs/`, starting with this file.
- Structure of packages, deploys, and data stays in `docs/architecture/`.
- Reviewable implementation tickets live in `docs/build-plan/`. See [build-plan/README.md](build-plan/README.md).
- Repeatable procedures go in `docs/skills/` once they are real. That folder is empty of skills on purpose. See [skills/README.md](skills/README.md).
- Amazon RDS for PostgreSQL is the database recommendation. JSON stays the store until the owner confirms it. This plan does not create the database.
- A later note that says the monorepo cannot hold Bookings has to explain why. Until that explanation exists, Bookings stays a package in this repository with its own deploy.
