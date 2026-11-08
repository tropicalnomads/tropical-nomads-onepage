# 05 — Web, iOS, and Android repositories

**Status:** not started. Three shells. No production deploy. No purchase flow.

## Outcome

Three repositories run as one product. Each opens the same areas: upcoming events, my tickets, check-in, and merch. The areas are placeholders. Each repo depends on the shared package. None of them is on www or in a store.

## Why it exists

The owner wants one repo for the web app, one for iOS, and one for Android, sharing theme and types rather than sharing a single frontend package inside this monorepo. The one-pager stays the marketing site. `src/app/App.tsx` is a single scrolling page. It is not the app shell.

## Depends on

- [03 — Deployment change](03-deployment-change.md). Adding repos must not retarget www.
- [04 — Shared client repo](04-shared-client-repo.md).
- [01 — Identify the stack](01-identify-stack.md) for the web lean. Use Next.js for the web repo only if the owner has accepted that lean. If they have not, stop before installing it.

## To-do

1. Create the three repositories when this ticket is implemented. Do not nest them inside `tropical-nomads-onepage`.
2. Web repo: shell only, on the accepted web lean. Placeholder routes for the four areas. Do not convert the one-pager.
3. iOS repo and Android repo: the same four areas. They import theme tokens and types from the shared package. They do not restate event field names locally.
4. If ticket 01's component technology is still open, build the shells with platform screens that consume tokens and schemas. Do not block the shells on a shared button library. Do not invent a fourth UI framework.
5. Do not add payment, ticket generation, stock edits, or Bookings admin.
6. Do not add a language list. Leave one place copy can be translated later. Leave `src/i18n/` (`en` and `pt`) on the one-pager.
7. Do not register a production domain, Amplify app, TestFlight, App Store, or Play listing.
8. Do not point www at the web repo.
9. Do not treat `vite-plugin-pwa` as the iOS or Android app. That plugin stays on the one-pager.

## Acceptance criteria

- Each repo builds.
- Each repo shows the four placeholder areas.
- Each repo's dependency on the shared package resolves.
- www still serves the one-pager, and no store listing exists.

## Tests

Each repo has a unit test that a navigation map includes the four area ids from a constant in the shared package. The implementer runs those tests and the one-pager `pnpm lint` and `pnpm build`.
