# Tropical Nomads documentation

This folder is the written home of the Tropical Nomads product. It is meant to grow. These files are planning notes. They do not change how the one-pager behaves.

## Product documentation

Plans, product descriptions, and open questions live at the top of `docs/`.

- [master-plan.md](master-plan.md) — the product in plain words, all nine capabilities, how the areas connect, the main flows, security outcomes, what is decided, and what is still open.

Add a document here when the topic is what the product is, or what the owner has decided. Link it from this page. When an open question in the master plan gets an answer, record the answer beside that question so the plan stops calling it undecided.

## Architecture

High-level structure lives in [`docs/architecture/`](architecture/monorepo-and-data.md).

- [architecture/monorepo-and-data.md](architecture/monorepo-and-data.md) — this repo keeps the one-pager, the API, Bookings, and JSON. Web, iOS, and Android are separate repos, plus a shared repo for theme, components, types, schemas, and constants. The one-pager keeps its own deploy.

Add a note here when it is about packages, deploys, or data. Vendor names and application code stay out of this folder until the owner has actually chosen them. A choice, once made, is a dated decision, and the matching open question in the master plan is updated with it.

## Build plan

Reviewable implementation tickets live in [`docs/build-plan/`](build-plan/README.md).

- [build-plan/README.md](build-plan/README.md) — the recommended order, one step at a time, and which ticket covers each capability.

These tickets describe work for the owner to accept before anyone builds. They do not add packages, dependencies, or a deploy. Each ticket ends with acceptance criteria. Unit tests cover pure rules when a ticket is built. Cognito, invited door staff, QR scan at the door, and separate app repositories are recorded as owner decisions. The payment company, languages, and the database stay open.

## Skills

[`docs/skills/`](skills/README.md) is the shelf for repeatable team procedures.

- [skills/README.md](skills/README.md) — what belongs in this folder.
- [skills/ticket-delivery.md](skills/ticket-delivery.md) — how an accepted build-plan ticket is delivered: product manager, technical lead, developer, then QA. The developer writes implementation notes before QA. QA tests the ticket’s acceptance criteria, including unit tests when they can cover the change. The owner reviews after QA.
- [skills/implementation-notes.md](skills/implementation-notes.md) — the notes the developer writes after implementation and before QA: one short skill for the ticket, and one skill per new tool or feature.

A skill file belongs here only when the procedure is real. Placeholder skills do not belong here. Product decisions and architecture notes do not belong here either.

## Status

8 November 2026. Planning only.

Decided on 8 November 2026: Amazon Cognito login with Google and Apple, admin-invited door staff who scan QR codes, and separate repositories for the web app, iOS, Android, and a shared theme and types repo. Still open: the payment company (interfaces come first), which other AWS services, the database, languages, and how shared UI components are built across those three app repos. The build plan holds the recommended order.
