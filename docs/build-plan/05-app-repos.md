# 05 — Web app repository

**Status:** done as a shell in this monorepo. The package is `apps/web`, name `tropical-nomads-web`, version `0.1.0`. It is not deployed. No Amplify app, production domain, or ECS service was created. No iOS or Android repository was created. No AWS account was connected.

The README lists this shell as step 6. [Types and schemas](28-types-and-schemas.md) are step 5 and now live in `packages/shared`. The shell does not restate event field names.

## Outcome

`apps/web` runs in a desktop browser and in a phone browser. It opens four placeholder areas: upcoming events, my tickets, check-in, and merch. The area ids come from `tropical-nomads-shared` (`webAreas`, package version `0.2.0`). The shell is not on www.

The owner asked for this package in the monorepo, on a pull request into `dev`. The planning text described a separate GitHub repository. That remote was not created.

The owner asked for the shell to reuse the one-pager’s design, components, styles, and colors. It imports that Tailwind theme, `globals.css`, `palette.ts`, the Outfit font, the cream logo, and `EmptyState`. Header and footer use the same classes as `SiteHeader` and `Footer`. `SiteHeader` itself stays on the one-pager because it also runs the language switch and the marketing section list.

## Why it exists

The product people open, including on a phone, is this web app. iOS and Android repositories are optional and last (ticket 19). They are not part of this ticket. The one-pager stays the marketing site.

## Depends on

- [03 — Deployment change](03-deployment-change.md). `amplify.yml` still publishes only `apps/one-pager/dist`.
- [04 — Shared client repo](04-shared-client-repo.md).
- [01 — Identify the stack](01-identify-stack.md). The owner accepted Next.js. It is installed in this package only.

The shell does not load events. It reads area ids from the shared package, not the schema field list.

## To-do

1. Add the web shell in this monorepo. Do not create a GitHub remote, and do not create the iOS or Android repositories.
2. Shell only. Placeholder routes for the four areas. The layout is usable at phone width.
3. Import theme tokens and the area ids from the shared package. Colors and styles come from the one-pager. Do not restate event field names locally.
4. Do not add payment, ticket generation, stock edits, or Bookings admin.
5. Do not build the language switch. Ticket 20 does that.
6. Do not create the web app's Amplify app, a production domain, or an ECS service.
7. Do not point www at this package.
8. Do not treat `vite-plugin-pwa` on the one-pager as this app.

## Acceptance criteria

- `pnpm --filter tropical-nomads-web build` succeeds.
- A phone-width browser and a desktop browser both show the four placeholder areas.
- The package depends on `tropical-nomads-shared`.
- www still serves the one-pager. No Amplify app exists for this package. No iOS or Android repo was created.

## Tests

A unit test checks that the navigation map includes the four area ids from `webAreas` in the shared package. The implementer also runs the one-pager `pnpm lint` and `pnpm build`.

## Security

The four pages are static placeholders. Check-in has no scanner and no ticket field. Nothing on these pages sells a ticket, lists a ticket, or edits stock. The pages send `noindex`. Next.js telemetry is off in the package scripts, and the `X-Powered-By` header is off. The shell does not read `data/operational` or `public/data`.
