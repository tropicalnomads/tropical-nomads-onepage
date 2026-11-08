# 02 — Repository shape

**Status:** not started. Describes the layout. This change does not move or create repositories.

## Outcome

`tropical-nomads-onepage` is a monorepo whose packages are the current one-pager, the API, and Bookings, plus JSON data. The shared repo and the web app repo are named slots, still empty until their tickets. iOS and Android are named and optional. There is no extra copy of the event catalog.

## Why it exists

Bookings and the public site have to read and write the same artists, parties, and calendar. That data stays in this git repository, next to the API. The owner also asked for the installable apps to be separate repositories, with a shared repo for theme colors, base components, types, schemas, constants, and anything else they can share.

Today the one-pager is the repository root: `package.json` (name `tropical-nomads-page`), `pnpm-lock.yaml`, `index.html`, `vite.config.ts`, `src/`, `public/`, `scripts/`. There is no `pnpm-workspace.yaml`.

## Depends on

- [01 — Identify the stack](01-identify-stack.md). Keep pnpm, which this repo already uses, unless that ticket's accepted note says otherwise.

## To-do

1. Keep this git repository for the one-pager, the API, Bookings, and the JSON. Do not create a separate repo for Bookings or for the event files.
2. Make the current root project one package. Files that move with it:
   - `package.json`, `pnpm-lock.yaml`, `index.html`, `vite.config.ts`
   - `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
   - `tailwind.config.ts`, `postcss.config.js`
   - `src/`, `public/`, `scripts/`
3. Leave that package's behavior alone: same pages, same `pnpm build`, same `/data/*.json` fetches, same `src/lib/merch.ts` shop, same `en` / `pt` copy, same link to `https://bookings.tropical-nomads.com`.
4. Add empty package slots in this repo for the API and for Bookings. Bookings deploys only to `bookings.tropical-nomads.com`.
5. Name the client repositories. Do not create them on GitHub until their tickets. Required: the shared repo (ticket 04) and the web app (ticket 05). Optional and last: iOS and Android (ticket 19), repos only.
6. Keep published JSON with the one-pager: `public/data/events.json`, `artists.json`, `venues.json`, `labels.json`, `partners.json`, `socials.json`, `agencies.json`, and banners under `public/events/banners/`. Curated inputs stay in `scripts/data/`. The web app does not get its own copy.
7. Name a place for operational JSON that is not inside `public/`. Leave it empty. Ticket 11 fills the decision. Ticket 01 recommends Amazon RDS for PostgreSQL and does not migrate. This ticket does not create that database.
8. Folder names inside this repo are chosen when the move happens. Use the same names from ticket 03 onward.

## Acceptance criteria

- A workspace install builds the one-pager the way `pnpm build` does today.
- The API and Bookings slots exist in this repo and contain no shipped app.
- The shared repo and the web app repo are named. iOS and Android are named as optional. None of those remotes were created early.
- `public/data/events.json` is still the only events file.

## Tests

No new unit test in this ticket. The implementer runs `pnpm lint` and `pnpm build` for the one-pager package after the move. Both pass. The published pages still load `/data/events.json`.
