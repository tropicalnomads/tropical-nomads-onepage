# Tropical Nomads — product plan

**Status:** planning only.
**Date:** 6 November 2026.
**Owner:** Júlio Locatelli Piva.
**Repository:** this one-pager repository, `tropical-nomads-onepage`.

This plan describes the product and the later shape of the repository. It does not implement the product, add packages, or choose vendors. The one-pager keeps its current behavior.

Read it with the [documentation index](README.md) and the [architecture notes](architecture/monorepo-and-data.md).

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
- Choosing a tech stack, cloud, database, or payment provider.
- The first build step in section 8.

## 2. The nine capabilities

Each item below is in the product. The plan keeps all nine.

### 2.1 Upcoming events

People can see the next events: what, when, and where, with the lineup and partner context the page already cares about. The list is the front door to tickets. A party edited on the admin calendar and a party shown on the public list are the same record.

### 2.2 Tickets

A visitor can buy a ticket for an event, and the product generates that ticket. The purchase-to-ticket flow is: choose the event, pay, receive a ticket the product created, find that ticket again later, and present it for check-in. The ticket is tied to that purchase. Ticket format, ticket types, and the delivery channel are undecided (section 7).

### 2.3 Check-in

The application has an area for checking in tickets that were purchased. Check-in accepts a genuine ticket for the right event and records the result. Who stands in that area — door staff, the buyer, or someone else — is undecided. The area exists either way. Section 4 describes the flow.

### 2.4 Payments

Ticket purchases are paid, and the product keeps a trace of what was paid: who, how much, which tickets, and the status. The provider is undecided. The trace stays understandable after a provider is chosen.

### 2.5 Merch store

The product sells T-shirts and other merchandise. Today's page shows two shirts and a WhatsApp reservation. The product store is a catalog a customer can buy from. Which other products exist, and whether a shirt is paid through the same path as tickets, are undecided.

### 2.6 Inventory

Stock is controlled. A real sale changes the count. The team can see and correct stock. The public store shows availability that matches those counts. Today's counts are constants in `src/lib/merch.ts`. In the product, stock is data, held as JSON until a database is chosen (section 5, and the architecture notes).

### 2.7 Abuse-resistant security

Security is a capability that runs through the others. It is not a page. Visitors, buyers, the check-in role, and admins have different permissions. Tickets are hard to forge. Check-in is limited to people who are supposed to validate tickets. Payments leave a trace. Bookings admin and inventory admin are for the team. Section 6 states the outcomes. Those outcomes are goals for the new product. They are not an audit of the current websites.

### 2.8 Bookings in this monorepo

Tropical Nomads Bookings lives in this repository, deploys on its own, and stays at `bookings.tropical-nomads.com`. It shares artists, parties and events, and the calendar with the website and app. Both products read and write that shared data. Section 5 and the [architecture notes](architecture/monorepo-and-data.md) describe how one repository supports that separate deploy.

### 2.9 Admin party calendar

Bookings admin includes a calendar of parties and festivals. The team uses it to assemble artists' agendas. Those parties are the same parties the public site can list. What an agenda contains, beyond an artist and the parties they play, is undecided.

## 3. How the areas connect

```
Upcoming events  →  Tickets  →  Payments  →  Issued ticket  →  Check-in

Merch store      →  Inventory  →  payment path undecided

Bookings admin   →  Party calendar  →  Artist agendas
        \                                  /
         \---- shared artists, parties/events, calendar
```

- **Events feed tickets.** An event can be listed with nothing for sale. An event that sells tickets opens the purchase flow.
- **Tickets go with payment.** The product issues the ticket when that order's payment is complete. What "complete" means depends on the provider, which is undecided. The order and the payment trace stay together.
- **Check-in uses the issued ticket.** Check-in does not create a ticket and does not take payment.
- **Merch and inventory are a pair.** The store sells what inventory says is available. Inventory owns the count.
- **Merch payment sits next to ticket payment, and it is a separate decision.** Ticket payment is required. Whether a shirt is paid inside this product is undecided.
- **Bookings and the public product share artists, parties/events, and the calendar.** Both products read and write those records. The admin party calendar is where agendas are assembled. Visitors see the published parties. A public lineup and an agenda in Bookings are two views of the same data.
- **Security sits on every arrow.** A visitor can read published events. Writing a party, changing stock, issuing a ticket, or recording a check-in needs the matching permission.

### Information architecture

Areas the product needs. The names describe the job. They are not screen titles, and they are not a build order.

| Area | Who uses it | What it is for |
| --- | --- | --- |
| Public events | Visitor, buyer | Upcoming events, and enough detail to decide to go |
| Ticket purchase | Buyer | Choose tickets, pay, receive the generated ticket |
| My tickets | Buyer | Find the ticket again, and see what was paid |
| Check-in | Check-in role | Validate a purchased ticket and record the result |
| Merch store | Merch customer | Browse T-shirts and other products, and buy what is in stock |
| Inventory | Inventory admin | See and correct stock |
| Party calendar | Bookings admin | See parties and festivals, and build artist agendas |
| Shared catalog | Website/app and Bookings, both reading and writing; visitors see the published view | Artists, parties/events, calendar |
| Orders | Team | See ticket orders and payment traces |

"My tickets" means the buyer can return to a purchase. Whether that needs an account is undecided. The area can be named before that choice.

Bookings admin and inventory admin are both team-only. Whether they are one role or two is undecided. The areas stay separate because agendas and stock are different jobs.

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

1. From an event, choose what to buy. Ticket types and prices are undecided.
2. Confirm the order and pay through the provider chosen later.
3. The product generates the ticket and gives it to the buyer.
4. The buyer can open that ticket again and see what was paid.
5. At the event, check-in validates that ticket.
6. The buyer does not set the price and does not invent a ticket. The buyer records a check-in only if section 7's check-in decision later gives them that role.

### Door / check-in staff

Who performs check-in is **undecided**. It may be door staff, the buyer, or another person the team names. This flow is the check-in role. If the owner later decides the buyer checks themselves in, the same validation applies and the staff label changes.

1. Open the check-in area, for an event this role is allowed to handle.
2. Take the buyer's ticket, in whatever format is chosen later.
3. The product checks that the ticket was issued, matches this event, matches a real payment, and is still valid under the rules. Re-entry and transfers are undecided.
4. The product records the check-in: which ticket, which event, when, and who performed it.
5. A refused check-in (unknown, unpaid, wrong event, or already used when the rules say so) is visible to this role, and the holder is not admitted.
6. This role does not create tickets, edit the lineup, or change stock.

### Merch customer

1. Open the store and see T-shirts and any other products on sale.
2. See which sizes or variants are available. The count comes from inventory.
3. Buy or reserve. The current page reserves by WhatsApp and names a Dublin pickup. The product's channel, price rules, and pickup versus shipping are undecided.
4. A completed sale reduces stock, so two customers cannot take the last piece.
5. The customer does not edit counts.

### Admin

Admin means the team. Two jobs are already named. Refunds, guest tickets, and similar team jobs are undecided.

**Bookings admin**

1. Sign in to Bookings admin. It is a team area.
2. Open the party calendar and see parties and festivals.
3. Place artists on those parties and assemble each artist's agenda.
4. Save. Shared artists, parties/events, and the calendar update, so the public product and Bookings use the same records.
5. The public list shows the published view. Whether a draft party can stay off that list is undecided (section 7).

**Inventory admin**

1. Sign in to the inventory area. Team only.
2. See products and counts.
3. Adjust stock when goods arrive, when they sell, or when a count needs a correction.
4. The store's availability follows the new counts.

**Orders** — the team member who looks after ticket sales:

1. See orders and the payment trace for each one.
2. See which tickets were issued and which were checked in.
3. Refunds, comps, and cancellations are undecided. The trace needs room to record them once those rules exist.

## 5. Repository shape

The [architecture notes](architecture/monorepo-and-data.md) hold the detail. What is already settled:

- Later work stays in **this** repository. There is no new unrelated repository.
- The repository becomes a **monorepo** when that conversion is requested. This plan does not convert it.
- The **current one-pager stays as one package** inside that monorepo.
- A **new frontend package** is added later, for the web app.
- A **new API package** is added later.
- **Bookings** is a package in the same monorepo, with its **own deploy**, still at `bookings.tropical-nomads.com`.
- **Shared data** is artists, parties/events, and the calendar. The website/app and Bookings both read and write it.
- The data store is **JSON files until a database is chosen**. No database is selected here.
- One repository can carry this. Bookings can have its own deploy without its own repository. A split into unrelated repositories is not the plan. The architecture note says why the monorepo holds.

### How the pieces relate

| Piece | Role | Deploy |
| --- | --- | --- |
| One-pager package | The current site, kept as its own package | The current public site, until a later build changes that |
| Web app package | New frontend for one product on web, iOS, and Android. How the iOS and Android apps are produced is undecided. | Introduced by the later build in section 8. Host details are undecided. The build plan's app-shell ticket does not deploy it. |
| API package | Reads and writes JSON for both products | Host details are undecided. |
| Bookings package | Bookings, including the admin party calendar | `bookings.tropical-nomads.com` |
| JSON data | Shared records, and a separate set of operational records, until a database exists | The files are the store. They are not a third website. |

Operational records — tickets, payment traces, check-ins, and live stock — are JSON too, until a database exists. They are a different set of files from the public event JSON the site already ships. Publishing ticket secrets under `public/data/` would make them world-readable, which section 6 rules out.

## 6. Security and anti-abuse

These are the outcomes the product is designed for. They describe the future product. They are not a claim about the current websites, and they are not an implementation guide.

### People and permissions

- A **visitor** can read published events and the public store.
- A **ticket buyer** can see and present their own tickets and their own payment traces.
- A **check-in role** can validate tickets for events they are allowed to handle, and can record the result. They cannot issue tickets or change prices. Who holds the role is undecided.
- A **merch customer** can buy what is in stock and cannot edit inventory.
- **Bookings admin** can edit the party calendar, artists, and agendas. Team only.
- **Inventory admin** can edit stock. Team only.
- One person may hold more than one team role. The permissions stay distinct, so a check-in device is not also an editor of the catalog.

The sign-in method is part of the undecided stack. Whether buyers need an account is its own open question. The permission split above is the product rule those mechanisms have to meet.

### Tickets

- The product issues a ticket. An image a buyer made, or a copied event id, is not a ticket.
- The value presented at the door is unguessable, and it is stored with the issued ticket. It is absent from the public event JSON.
- Check-in asks the product whether the ticket is real. The client's claim is not the check.
- A ticket belongs to a purchase and an event. Presenting it for a different event fails.
- The product records each check-in and its result. Transfer, re-entry, and a second scan are undecided rules. The record exists so those rules can be applied once they are chosen. A refused ticket does not admit the holder.
- Guest tickets and free tickets, if they exist later, are still issued by the product and still leave a trace.

### Check-in

- Only the check-in role can record a check-in.
- A recorded attempt names the ticket, the event, the time, and who performed it.
- A run of invalid attempts is a fraud signal the product should be able to slow down. The thresholds belong to implementation, after the stack is chosen.
- Doors with no network are an open question. Any later offline mode still syncs into the same check-in record, so two doors cannot both accept one ticket with the product unaware.

### Payments

- Every ticket charge has a trace: buyer, amount, currency, tickets covered, status, time, and the provider's reference.
- The browser does not declare that a payment succeeded. The status changes when the provider confirms it.
- The product stores the payment trace. Raw card numbers stay out of Tropical Nomads' own data.
- The amount on the trace is the amount charged. A later price edit does not rewrite a past charge.
- A ticket is issued for a payment the product considers complete. A ticket with no confirmed payment is the case this capability is here to prevent.
- Refunds and chargebacks are undecided. The trace needs room to show them, so a refunded ticket does not keep checking in as paid.

### Admin access

- Bookings admin and inventory admin are team-only.
- Writes to artists, parties/events, and the calendar are team actions. The public site reads the published result.
- Inventory changes are team actions, plus the stock movement a completed merch sale creates.
- An admin action that changes money, tickets, or stock records who did it.

### Public files and private files

- Files shipped with the public site are readable by anyone. They can hold published events, artists, venues, partners, and public product info.
- They stay clear of ticket secrets, payment traces, check-in records, admin-only notes, and credentials.
- The store can show "available" or "sold out" without publishing the team's full stock history.
- Both deploys write through the API's control of the JSON. A visitor on the marketing site cannot edit a party by fetching a file.

## 7. Open questions

Every row below is **undecided**. This plan does not pick an answer.

### Named by the owner

| Topic | Status | What stays attached to the question |
| --- | --- | --- |
| Tech stack | Undecided | The owner leans toward Next.js for the new app frontend and AWS for backend, database, and platform tools. That lean is a preference to evaluate, recorded in the build plan, and it is not a lock. API style and auth stay open. The one-pager's Vite app is not the choice for the new packages. |
| Cloud vendor | Undecided | AWS is the candidate, because the domain and a lot of hosting are already there. Which AWS services to use is open. `amplify.yml` describes the current static site only. |
| Payments provider | Undecided | Ticket payments need a provider and a trace. The company is open. |
| Ticket format | Undecided | QR code, wallet pass, or another format. The product still generates a ticket it can validate. The format is unchosen. |
| How iOS and Android are produced | Undecided | Web, iOS, and Android are all in scope, as one product. Shared UI versus native UI is the open choice. The one-pager's PWA plugin is current site tooling, not that choice. |
| Who performs check-in | Undecided | Door staff, the buyer, or someone else. Section 4 describes the role. |
| Languages and markets | Undecided | The one-pager currently has English and Portuguese. That does not decide the product's languages, countries, or currencies. |
| Implementation order | Proposed for review | A recommended ticket order is in [docs/build-plan/](build-plan/README.md). It is waiting for the owner. The first product step is still a web app with an API. |

### Also undecided, and needed before implementation

- Whether a buyer needs an account, and how they get the ticket back (in the app, by email, or another channel).
- Ticket types, currencies, comps, guest lists, transfers, re-entry, refunds, and cancellation.
- Whether merch uses the ticket payment capability, and whether fulfillment is pickup, shipping, or both. Today's page describes a WhatsApp reservation and pickup at The Sound House, Dublin.
- Which products exist beyond T-shirts.
- What an artist agenda contains, and how much of it the public site shows.
- Whether a party can stay on the admin calendar and off the public list.
- Whether `timetable.tropical-nomads.com` remains a separate surface. This plan leaves it where it is.
- Whether Goabase, or any external party list, remains an input. Today it is how event JSON is refreshed.
- Whether Bookings admin, inventory admin, and the person who reviews orders are one role or several.
- Where writable JSON lives — in git, or in a private location the API updates — and how two deploys avoid overwriting the same file. The store is JSON either way until a database is chosen. The database engine is undecided too.
- Whether check-in has to work offline at the door.
- How `www` is served once the one-pager package and the new web app package both exist. That question belongs to the later build in section 8.

## 8. What to decide first

This is a planning sequence. It is the order of decisions. It is not a build schedule, and it is not the order to write code.

1. **Confirm the restatement** in section 1, including all nine capabilities, and the boundary with today's one-pager, Bookings, and the timetable site.
2. **Name the actors.** Especially who checks tickets in, and whether Bookings admin, inventory admin, and order review are one team role or several. Decide whether buyers need an account.
3. **Agree the shared records** well enough to sketch JSON later: event/party, artist, calendar entry, artist agenda. Include what Bookings writes, what the public list shows, and whether drafts stay private.
4. **Agree ticket and payment outcomes** before format or provider: what the buyer receives, what check-in has to prove, and the rules for transfer, re-entry, comps, and refunds.
5. **Agree merch and inventory rules:** the catalog, pickup versus shipping, and whether a shirt is paid inside this product. Stock moves when a sale is real.
6. **Split public JSON from private JSON,** including where writable files live. Do this before API work, so ticket secrets stay out of the public site bundle.
7. **Choose languages and markets** for the product. English and Portuguese on the current page remain a fact about the one-pager while that choice is open.
8. **Choose how iOS and Android are produced** — shared UI with the web app, or native UI on the same API. Web, iOS, and Android are already in scope as one product. The one-pager's PWA plugin stays a fact about the current site.
9. **Choose stack details, cloud services, and the payment provider** once the flows and the data boundary are clear enough to compare options. The build plan's first ticket records the Next.js and AWS lean for evaluation and leaves API style, the database, auth, and the payment provider open. This document does not compare vendors.
10. **Set the remaining implementation order** after those decisions. One constraint is already fixed. It sits below, separate from this list, so it is not mistaken for a full build plan.

### Later build constraint

When the owner explicitly asks to start building, the **first build step** is to turn the Tropical Nomads page into a web app that can have an API.

That step adds the new frontend package and the API package beside the current one-pager package, and it uses JSON files as the data store. The [build plan](build-plan/README.md) splits that step, and everything after it, into tickets for review. This plan still does not build them.

## 9. How this folder grows

- Product decisions and open questions stay in `docs/`, starting with this file.
- Structure of packages, deploys, and data stays in `docs/architecture/`.
- Reviewable implementation tickets live in `docs/build-plan/`. See [build-plan/README.md](build-plan/README.md).
- Repeatable procedures go in `docs/skills/` once they are real. That folder is empty of skills on purpose. See [skills/README.md](skills/README.md).
- A future database replaces the JSON store. It does not create a second product, and it is not chosen here.
- A later note that says the monorepo cannot hold Bookings has to explain why. Until that explanation exists, Bookings stays a package in this repository with its own deploy.
