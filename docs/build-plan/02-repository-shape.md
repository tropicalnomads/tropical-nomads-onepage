# 02 — Repository shape

**Status:** done. The one-pager is one package. The API and Bookings slots are empty. No client repository was created on GitHub. The new app is not deployed. No AWS account was connected.

## Outcome

`tropical-nomads-onepage` is a pnpm workspace. Turborepo runs the package tasks. The packages in this repo are the current one-pager, the API slot, and the Bookings slot. Published JSON stays with the one-pager. Operational JSON has an empty place outside `public/`.

The owner asked for Turborepo, and for pnpm as the package manager. The one-pager already used pnpm. It stays one package and keeps its existing Amplify deploy.

## Layout

| Path | What it is |
| --- | --- |
| `apps/one-pager` | The current site. Package name `tropical-nomads-page`. `pnpm build` is still `tsc -b && vite build`. |
| `apps/api` | Empty API slot. No server and no public URL. |
| `apps/bookings` | Empty Bookings slot. The later deploy is `https://bookings.tropical-nomads.com` only. |
| `data/operational` | Empty. Not inside `public/`. The one-pager does not publish it. Ticket 11 fills it. No database is created here. |
| `pnpm-workspace.yaml` | Workspace root. The lockfile stays here so `pnpm install --frozen-lockfile` at the root still works. |
| `turbo.json` | Task runner. Root `pnpm build` and `pnpm lint` run only `tropical-nomads-page`. |
| `amplify.yml` | Still the one-pager's deploy. It publishes `apps/one-pager/dist` and does not publish the API or Bookings. |

Folder names above are the names later tickets use.

## Client repositories

Named only. None of these remotes were created.

| Name | Ticket | Required |
| --- | --- | --- |
| `tropical-nomads-shared` | 04 | Yes |
| `tropical-nomads-web` | 05 | Yes |
| `tropical-nomads-ios` | 19 | Optional, last |
| `tropical-nomads-android` | 19 | Optional, last |

They are not nested in this repo. The web app does not get a copy of `public/data`.

## Why it exists

Bookings and the public site have to read and write the same artists, parties, and calendar. That data stays in this git repository, next to the API. The owner also asked for the installable apps to be separate repositories, with a shared repo for theme colors, base components, types, schemas, constants, and anything else they can share.

Today the one-pager was the repository root. It is now `apps/one-pager`.

## Depends on

- [01 — Identify the stack](01-identify-stack.md). pnpm stays. The one-pager already used it.

## To-do

1. Keep this git repository for the one-pager, the API, Bookings, and the JSON. Do not create a separate repo for Bookings or for the event files.
2. Make the current root project one package. Files that move with it:
   - `package.json`, `index.html`, `vite.config.ts`
   - `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
   - `tailwind.config.ts`, `postcss.config.js`
   - `src/`, `public/`, `scripts/`
   - The workspace lockfile stays at the repo root. Amplify installs from that root.
3. Leave that package's behavior alone: same pages, same `pnpm build`, same `/data/*.json` fetches, same `src/lib/merch.ts` shop, same `en` / `pt` copy, same link to `https://bookings.tropical-nomads.com`.
4. Add empty package slots in this repo for the API and for Bookings. Bookings deploys only to `bookings.tropical-nomads.com`.
5. Name the client repositories. Do not create them on GitHub until their tickets. Required: the shared repo (ticket 04) and the web app (ticket 05). Optional and last: iOS and Android (ticket 19), repos only.
6. Keep published JSON with the one-pager: `public/data/events.json`, `artists.json`, `venues.json`, `labels.json`, `partners.json`, `socials.json`, `agencies.json`, and banners under `public/events/banners/`. Curated inputs stay in `scripts/data/`. The web app does not get its own copy.
7. Name a place for operational JSON that is not inside `public/`. Leave it empty. Ticket 11 fills the decision. Ticket 01 recommends Amazon RDS for PostgreSQL and does not migrate. This ticket does not create that database.
8. Folder names inside this repo are `apps/one-pager`, `apps/api`, and `apps/bookings`. Use those names from ticket 03 onward.

## Acceptance criteria

- A workspace install builds the one-pager the way `pnpm build` does today.
- The API and Bookings slots exist in this repo and contain no shipped app.
- The shared repo and the web app repo are named. iOS and Android are named as optional. None of those remotes were created early.
- `apps/one-pager/public/data/events.json` is still the only events file.
- Operational JSON is not in the one-pager's published files.

## Tests

No new unit test in this ticket. The implementer runs `pnpm lint` and `pnpm build` for the one-pager package after the move. Both pass. The published pages still load `/data/events.json`.
