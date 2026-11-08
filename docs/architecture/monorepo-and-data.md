# Architecture notes

**Status:** planning only. High level. No vendors, no new packages, no application code.

These notes describe the future shape of this repository. The [master plan](../master-plan.md) is the product description. This page is how the repository, the deploys, and the data fit together. The [documentation index](../README.md) explains where new notes go.

## The shape already decided

Tropical Nomads stays in this repository, `tropical-nomads-onepage`. The repository becomes a monorepo when that conversion is requested. This document does not convert it.

```
This repository (monorepo): tropical-nomads-onepage
├── One-pager package     the current site, kept as one package
├── API package           new API, added in a later build
├── Bookings package      separate deploy at bookings.tropical-nomads.com
└── JSON data             shared and operational records, until a database is chosen

Separate repositories for the customer apps (owner, 8 November 2026)
├── Shared repo           theme colors, base components, types, schemas, constants
├── Web app repo
├── iOS app repo
└── Android app repo
```

The client repositories are separate because the owner asked for that. They stay one product by calling this API and by depending on the shared repo. Bookings and the JSON stay in this repository so the two deploys do not fork the catalog. Splitting Bookings out would copy the shared records. Splitting the apps out does not.

Shared data, read and written by both the website/app and Bookings:

- artists
- parties / events
- calendar

The website/app also covers upcoming events, tickets, check-in, payments, the merch store, and inventory. Those sit with the public product. They become Bookings data only if the owner later says so.

## Packages

Directory names below are roles. Real folder names wait until the owner asks to convert the repository. None of these packages are created by this note.

### One-pager package

The current site: pages, assets, and the JSON it already publishes. It remains one package inside the monorepo. Through this planning stage its behavior stays as it is. It is the package the public site is built from today.

### Customer app repositories

Three app repositories (web, iOS, Android) and one shared repository. The shared repo holds theme colors, base components, types, schemas, and constants. None of these repositories exist yet. Tickets are in the [build plan](../build-plan/README.md).

Theme tokens, types, schemas, and constants can be shared as data. A base component still needs a technology the three repos can consume. That technology is not chosen. Sign-in for the apps is Amazon Cognito, with Google and Apple.

When the owner asks to start building, the first product step is an API in this repo and a web app repository that can call it. That step is out of scope for the planning documents.

### API package

A new package that reads and writes JSON for the web app and for Bookings. It is how two deploys share one set of records. It does not exist yet. Host, protocol, and framework are undecided.

### Bookings package

Bookings, including the admin party calendar used to assemble artist agendas. It deploys on its own to `bookings.tropical-nomads.com`. It lives in this monorepo so it can share artists, parties/events, and the calendar with the other packages.

The Bookings code is a separate product today. It is not in this repository yet. Bringing that code in is part of the decided shape. Where that work sits after the first build step (web app with an API) is an open implementation-order question. See the master plan.

## Deploys

A separate deploy is a separate published site from the same repository.

| Publish target | What it runs | Where this stands |
| --- | --- | --- |
| `www.tropical-nomads.com` | The one-pager package | Stays this site's own deploy. The web app is a separate repository and is not published here by the early tickets. |
| `bookings.tropical-nomads.com` | The Bookings package | Decided as its own deploy. The package is not in the repo yet. |
| API host | The API package | Undecided. It may be its own hostname or attached to one of the sites. This note does not pick. |

`timetable.tropical-nomads.com` is a site the one-pager already links to for some events. It stays outside this diagram until the owner decides otherwise.

This repository contains `amplify.yml`, which builds the static one-pager. That file describes the current site. It is not a cloud choice for the API or for Bookings.

## Why one repository holds this

- Artists, parties, and the calendar need one contract. This repository is where that contract lives, next to every package that reads and writes it.
- Bookings can publish to its own domain from a package in the same repo. The deploy is per package. The git history is shared.
- The owner asked to keep the one-pager, the API, and Bookings in `tropical-nomads-onepage`. On 8 November 2026 the owner also asked for separate repositories for the web app, iOS, Android, and a shared client library. Those client repos consume this API. They are not a second copy of Bookings or of the JSON.
- A second repository for Bookings, the web app, or the API would copy the shared records, or it would invent a third repository whose only job is those records. The current constraints give no reason to do that.

A later split would need a written reason: a limit that a package plus its own deploy cannot meet. No such limit is known. This plan keeps the monorepo.

## How JSON files sit until a database is chosen

The store is JSON files. No database engine is selected. When a database is chosen, the same entities move and the product boundaries stay.

There are two kinds of JSON, because one kind is already public.

### Published reference data

The one-pager already ships JSON the browser fetches:

- `public/data/events.json`
- `public/data/artists.json`
- `public/data/venues.json`
- `public/data/labels.json`
- `public/data/partners.json`
- `public/data/socials.json`

`scripts/data/` holds inputs the event refresh uses: agencies, artist affiliations, lineups, media, venues, partners, and labels. `scripts/fetch-goabase-events.mjs` refreshes events from Goabase into the public files.

This set fits data the world is allowed to read: published events, artists, venues, and partners. The future API can keep writing these files, and the one-pager package can keep reading them, until the web-app step changes that path on purpose.

The files are a starting point for the shared entities. They are not a frozen schema. Events today carry a Goabase source id and external ticket URLs. The future ticket is issued by this product, so the records will need new fields. Those fields are not designed here.

Merch is not in these files. Price, pickup copy, and size counts are constants in `src/lib/merch.ts`. Inventory for the product is data. Until a database exists, that data is JSON. Moving those constants is later work.

### Operational data

Tickets, payment traces, check-in records, orders, and live stock change when someone buys or enters an event. They stay JSON until a database is chosen. They are a different set of files from the public event JSON.

The API package is the reader and writer:

- The web app asks the API to create an order, record a confirmed payment, issue a ticket, and check a ticket in.
- The store asks the API for availability. A completed merch sale updates stock through the API.
- Bookings admin asks the API to update artists, parties, and calendar entries. The public upcoming-events list reads the published result.
- While the one-pager is still the static site, it keeps reading the published reference JSON. This planning stage does not make it a writer of tickets.

The website/app and Bookings both read and write the shared entities — artists, parties/events, and the calendar — through that API, so the two deploys do not keep two copies.

### Left open on purpose

- Directory names and whether each entity is one file or many.
- Whether published reference JSON stays in git, which is how the one-pager works today.
- Where operational JSON lives. A file that changes on every sale, and that contains a ticket secret, is a poor fit for the public site bundle and a poor fit for a public git history. The store is still JSON. The private location, and how two writes at once (two doors, or a door and an admin) avoid losing an update, depend on the stack and the cloud. Both are undecided, and both have to be settled before implementation.
- The database that later replaces both kinds of JSON: engine, host, and migration.

### Shared write, public read

Bookings and the web app both write shared entities. The public site reads a published view. A party can exist on the admin calendar before it is ready for the public list. Whether drafts stay hidden is an open product question in the master plan. The architecture only keeps "saved in Bookings" and "visible on www" able to differ, so that rule can be chosen later.

## What a later database changes

The entities stay: artists, parties/events, calendar, agendas, tickets, orders, payment traces, check-ins, products, and stock. The API remains the door the web app and Bookings use. The JSON files stop being the store. Choosing the database is a later decision.

## What these notes leave alone

- Packages, workspace config, and dependencies.
- Cloud, framework, database, and payment provider.
- API routes, field-level schemas, and ticket encoding.
- The one-pager's runtime behavior.
