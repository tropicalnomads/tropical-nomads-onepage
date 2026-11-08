# Tropical Nomads documentation

This folder is the written home of the Tropical Nomads product. It is meant to grow. These files are planning notes. They do not change how the one-pager behaves.

## Product documentation

Plans, product descriptions, and open questions live at the top of `docs/`.

- [master-plan.md](master-plan.md) — the product in plain words, all nine capabilities, how the areas connect, the main flows, security outcomes, every item still undecided, and the order in which to decide them.

Add a document here when the topic is what the product is, or what the owner has decided. Link it from this page. When an open question in the master plan gets an answer, record the answer beside that question so the plan stops calling it undecided.

## Architecture

High-level structure lives in [`docs/architecture/`](architecture/monorepo-and-data.md).

- [architecture/monorepo-and-data.md](architecture/monorepo-and-data.md) — one monorepo, a separate Bookings deploy, shared artists / parties / calendar, and how JSON files hold the data until a database is chosen.

Add a note here when it is about packages, deploys, or data. Vendor names and application code stay out of this folder until the owner has actually chosen them. A choice, once made, is a dated decision, and the matching open question in the master plan is updated with it.

## Build plan

Reviewable implementation tickets live in [`docs/build-plan/`](build-plan/README.md).

- [build-plan/README.md](build-plan/README.md) — the recommended order, one step at a time, and which ticket covers each capability.

These tickets describe work for the owner to accept before anyone builds. They do not add packages, dependencies, or a deploy. Stack, cloud service details, payment provider, ticket format, who checks people in, and languages stay open. Next.js and AWS appear there as the owner's lean, still to be confirmed.

## Skills

[`docs/skills/`](skills/README.md) is the shelf for repeatable team procedures.

- [skills/README.md](skills/README.md) — what belongs in this folder.
- [skills/ticket-delivery.md](skills/ticket-delivery.md) — how an accepted build-plan ticket is delivered: product manager, technical lead, developer, then QA, before the owner reviews.

A skill file belongs here only when the procedure is real. Placeholder skills do not belong here. Product decisions and architecture notes do not belong here either.

## Status

8 November 2026. Planning only.

Still undecided, on purpose: the stack (Next.js and AWS are a lean to evaluate), which AWS services, the payment provider, ticket format, how iOS and Android are produced, who performs check-in, and languages. Web, iOS, and Android are all in scope as one product. A recommended ticket order is in the build plan, waiting for review. The master plan keeps the full open-question list.
