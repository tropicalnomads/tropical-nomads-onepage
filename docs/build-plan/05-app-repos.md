# 05 — Web app repository

**Status:** not started. Required. Web shell only. No production deploy. No native apps.

## Outcome

The web app repository runs in a desktop browser and in a phone browser. It opens four placeholder areas: upcoming events, my tickets, check-in, and merch. It depends on the shared package. It is not on www and it is not deployed to Amplify yet.

## Why it exists

The product people open, including on a phone, is this web app. iOS and Android repositories are optional and last (ticket 19). They are not part of this ticket. The one-pager stays the marketing site. `src/app/App.tsx` is a single scrolling page. It is not this shell.

## Depends on

- [03 — Deployment change](03-deployment-change.md). Adding the repo must not retarget www.
- [04 — Shared client repo](04-shared-client-repo.md).
- [01 — Identify the stack](01-identify-stack.md) for the web lean. Use Next.js only if the owner has accepted that lean. If they have not, stop before installing it.

## To-do

1. Create the web app repository when this ticket is implemented. Do not nest it inside `tropical-nomads-onepage`. Do not create the iOS or Android repositories here.
2. Shell only. Placeholder routes for the four areas. The layout has to be usable in a phone browser width, because that is how phones use the product.
3. Import theme tokens and types from the shared package. Do not restate event field names locally.
4. Do not add payment, ticket generation, stock edits, or Bookings admin.
5. Do not add a language list. Leave one place copy can be translated later. Leave `src/i18n/` (`en` and `pt`) on the one-pager.
6. Do not create the web app's Amplify app, a production domain, or an ECS service. Ticket 03 names those as later targets. This ticket does not launch them.
7. Do not point www at this repo.
8. Do not treat `vite-plugin-pwa` on the one-pager as this app.

## Acceptance criteria

- The web repo builds.
- A phone-width browser and a desktop browser both show the four placeholder areas.
- The repo depends on the shared package.
- www still serves the one-pager. No Amplify app exists for this repo. No iOS or Android repo was created.

## Tests

A unit test checks that a navigation map includes the four area ids from a constant in the shared package. The implementer runs that test and the one-pager `pnpm lint` and `pnpm build`.
