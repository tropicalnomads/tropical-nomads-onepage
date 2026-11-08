# 02 — Monorepo shape

**Status:** not started. Describes the layout to build later. This change does not move the repo.

## Outcome

This git repository is a monorepo. The current one-pager is one package inside it and still builds the site it builds today. The repo has a package slot for a new frontend, a package slot for an API, a package slot for Bookings, and JSON files as the data store. Bookings is set up to deploy separately and to share artists, parties/events, and the calendar. There is still one repository.

## Why it exists

The product family is the public site, the new app, the API, and Bookings. They share records. A second repository would copy those records or add a third repo whose only job is the files. The owner asked to keep working in `tropical-nomads-onepage`.

Today the one-pager **is** the repository root: `package.json` (name `tropical-nomads-page`), `pnpm-lock.yaml`, `index.html`, `vite.config.ts`, `src/`, `public/`, `scripts/`, Tailwind and TypeScript config. There is no `pnpm-workspace.yaml`. Amplify builds that root. The move has to make a package out of that tree without creating a new git repo and without changing what the site does.

## Depends on

- [01 — Identify the stack](01-identify-stack.md). Use pnpm, which this repo already uses, unless the accepted recommendation says otherwise. Do not introduce another package manager.

## To-do

1. Keep this repository. Do not create a GitHub repo for the app, the API, or Bookings. If a later note says the monorepo cannot hold Bookings, it has to explain the limit. No such limit is known.
2. Make the current root project one package. The files that belong to it are the ones that build and feed the site today:
   - `package.json`, `pnpm-lock.yaml`, `index.html`, `vite.config.ts`
   - `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
   - `tailwind.config.ts`, `postcss.config.js`
   - `src/`, `public/`, `scripts/`
3. Leave that package's behavior alone: same pages, same `pnpm build`, same `public/data` fetch, same `src/lib/merch.ts` shop, same English and Portuguese copy, same link to `https://bookings.tropical-nomads.com`.
4. Add three further package slots, empty of app code until their own tickets:
   - Frontend, for the new product (ticket 04).
   - API (ticket 05).
   - Bookings (ticket 15), with its own deploy target `bookings.tropical-nomads.com`.
5. Keep published JSON where the one-pager already serves it: `public/data/events.json`, `artists.json`, `venues.json`, `labels.json`, `partners.json`, `socials.json`, `agencies.json`, plus the banners under `public/events/banners/`. Curated inputs stay in `scripts/data/`. Do not fork a second copy of those files for the app.
6. Name a place for operational JSON (orders, tickets, check-ins, live stock) that is **not** inside `public/`. Leave it empty. Ticket 09 decides the private location and still uses JSON files. Do not add a database.
7. Shared data for the website/app and Bookings is artists, parties/events, and the calendar. Both products will read and write those through the API once ticket 06 and ticket 15 exist. Until then the one-pager only reads, which is what `loadEvents`, `loadPartners`, and `loadSocialLinks` do today.
8. Folder names are part of doing this ticket, not part of this plan. Pick them when the move happens and use them consistently in tickets 03 and after. Do not split any of the four packages into another repository.

## Done when

A workspace install builds the one-pager package the way `pnpm build` does today, the other slots exist without a shipped app, published JSON still lives with the one-pager, and `git remote` is still this repo only.
