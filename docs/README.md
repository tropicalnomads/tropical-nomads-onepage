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

## Skills

[`docs/skills/`](skills/README.md) is the shelf for repeatable team procedures.

- [skills/README.md](skills/README.md) — what belongs here later. No skill files are stored yet.

A skill file belongs here only after someone has done the task and can write steps another person can follow. Placeholder skills do not belong here. Product decisions and architecture notes do not belong here either.

## Status

6 November 2026. Planning only.

Still undecided, on purpose: tech stack, cloud vendor, payments provider, ticket format, native app versus PWA versus both, who performs check-in, languages and markets, and implementation order. The master plan lists each one with the context that has to stay attached to it.
