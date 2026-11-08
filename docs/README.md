# Tropical Nomads documentation

This folder is the written home of the Tropical Nomads product. It is meant to grow. These files are planning notes. They do not change how the one-pager behaves.

## Product documentation

Plans, product descriptions, and open questions live at the top of `docs/`.

- [master-plan.md](master-plan.md) — the product in plain words, all nine capabilities, how the areas connect, the main flows, security outcomes, what is decided, and what is still open.

Add a document here when the topic is what the product is, or what the owner has decided. Link it from this page. When an open question in the master plan gets an answer, record the answer beside that question so the plan stops calling it undecided.

## Architecture

Structure and records live in [`docs/architecture/`](architecture/README.md).

- [architecture/README.md](architecture/README.md) — the architecture index.
- [architecture/system.md](architecture/system.md) — repositories, deploys, and who calls the API, with mermaid diagrams.
- [architecture/models.md](architecture/models.md) — how the records point at each other, and the fields already named, with a mermaid diagram.
- [architecture/indexes.md](architecture/indexes.md) — the lookup each feature needs, which keys are unique, and which keys stay out.
- [architecture/monorepo-and-data.md](architecture/monorepo-and-data.md) — this repo keeps the one-pager, the API, Bookings, and JSON. The web app and a shared repo are separate. iOS and Android repos are optional and last. The one-pager keeps its Amplify deploy. The later hosts are Amplify for the web app and ECS for the API, and they are not live yet.

Add a note here when it is about packages, deploys, or data. Vendor names and application code stay out of this folder until the owner has actually chosen them. A choice, once made, is a dated decision, and the matching open question in the master plan is updated with it.

## Build plan

Reviewable implementation tickets live in [`docs/build-plan/`](build-plan/README.md).

- [build-plan/README.md](build-plan/README.md) — the recommended order, one step at a time, and which ticket covers each capability.

These tickets describe work for the owner to accept before anyone builds. They do not add packages, dependencies, or a deploy. Each ticket ends with acceptance criteria. Unit tests cover pure rules when a ticket is built. Cognito, invited door staff, QR scan at the door, English and Portuguese, and separate app repositories are recorded as owner decisions. The payment company stays unnamed. Amazon RDS for PostgreSQL is a recommendation to confirm. The new app is not live yet.

## Skills

[`docs/skills/`](skills/README.md) is the shelf for repeatable team procedures.

- [skills/README.md](skills/README.md) — what belongs in this folder.
- [skills/ticket-delivery.md](skills/ticket-delivery.md) — how an accepted build-plan ticket is delivered: product manager, technical lead, developer, then QA. The developer writes implementation notes before QA. QA tests the ticket’s acceptance criteria, including unit tests when they can cover the change. The owner reviews after QA.
- [skills/implementation-notes.md](skills/implementation-notes.md) — the notes the developer writes after implementation and before QA: one short skill for the ticket, and one skill per new tool or feature.

A skill file belongs here only when the procedure is real. Placeholder skills do not belong here. Product decisions and architecture notes do not belong here either.

## Status

8 November 2026. Planning only.

Decided: Amazon Cognito login with Google and Apple, an access list of admin, door, and user, English and Portuguese with internationalization, and a required web app plus a shared repo. The first iteration is the technical base, then the public product. Bookings is the second iteration. Ticket 28 writes every type and schema before the feature tickets. The diagrams are in `docs/architecture/`. Phones use the web app in the browser. Before a future go-live, and still not live: a separate Amplify app for the new frontend, a Docker container on ECS for the API, and a confirmation of Amazon RDS for PostgreSQL. JSON stays until that confirmation. The one-pager keeps its current Amplify deploy. Email is one sender with templates for registration, purchases, the QR code, door invites, new-party marketing, and artist offers. Marketing needs consent and can be stopped. No email vendor is chosen. Goabase is an integrations tab in the second iteration, a party list so Bookings can email artist offers through that sender. iOS and Android repos are optional and last. Still open: the payment company (interfaces come first; the remaining payment decisions are listed and no provider is picked) and API style. The new app does not go live yet. The build plan holds the recommended order.
