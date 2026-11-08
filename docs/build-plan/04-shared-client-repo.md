# 04 — Shared client package

**Status:** done. The package is `packages/shared`, version `0.1.0`. No GitHub remote was created. The web app was not created. No AWS account was connected.

## Outcome

`tropical-nomads-shared` holds the theme tokens, the text component contract, the public origins, and the schema entry. Ticket 28 fills every schema field. The package is not a database. iOS and Android do not consume it yet.

The owner asked for this as a package in the monorepo. The planning text described a separate repository. That remote was not created. The one-pager keeps its own files and its own deploy.

## Depends on

- [02 — Repository shape](02-repository-shape.md).

## To-do

1. Add the shared package in this monorepo. Do not create a GitHub remote, and do not start the web app.
2. Add theme tokens taken from the current palette and Tailwind theme: brand and feedback colors, the Outfit font stack, and the type scale. A component refers to a token name.
3. Add the schema entry and leave it empty of the field list. Ticket 28 writes every schema.
4. Add the origins `https://www.tropical-nomads.com`, `https://bookings.tropical-nomads.com`, and `https://timetable.tropical-nomads.com`.
5. Add a base text view the web app can render. No native screens.
6. Version the package at `0.1.0`. It is private and is not published to a registry.
7. Do not copy `public/data/*.json` into the package.

## Acceptance criteria

- The web app can depend on `tropical-nomads-shared` version `0.1.0`.
- `schemas` exports, and it has no fields yet.
- `apps/one-pager/src/theme/palette.ts` and `apps/one-pager/public/data` are unchanged.
- www still publishes only the one-pager.

## Tests

- Theme token names used by the text contract exist in the token set.
- The schema entry exports, and the field checks belong to ticket 28.

`pnpm lint` and `pnpm build` for the one-pager still pass.
