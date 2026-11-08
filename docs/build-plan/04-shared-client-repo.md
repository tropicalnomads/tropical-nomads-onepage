# 04 — Shared client repo

**Status:** not started. Creates the shared repository's contents when the owner asks to build. This planning change does not create the repo.

## Outcome

One shared repository holds the theme colors, base components, constants, and the package where schemas will live. Ticket 28 fills every schema before the feature tickets. The package matches the API. It is not a second database. iOS and Android are not required to consume it yet.

## Why it exists

The web app should not invent a second copy of a user, a ticket, or a color. The owner asked for one shared place. Native repos, if ticket 19 is done later, can use the same package. They are not part of finishing this ticket. This repo (the one-pager) already has the visual facts to seed the theme: Tailwind and `src/theme/palette.ts`. It also has the event types in `src/lib/types/event.ts`. Those are the starting point to copy into the shared repo as the contract. The one-pager keeps its own files. The shared repo does not become a new home for `public/data`.

## Depends on

- [02 — Repository shape](02-repository-shape.md).

## To-do

1. Create the shared repository when implementation of this ticket starts. Do not put it inside `tropical-nomads-onepage`.
2. Add theme tokens taken from the current palette and Tailwind theme: colors, and the type scale the page already uses. Name them so a later component can refer to a token instead of a hex value copied into each app.
3. Add the schema package and leave it empty of the field list. Ticket 28 writes every schema from the models page before the feature tickets.
4. Add constants the apps must not re-invent: the public site origin `https://www.tropical-nomads.com`, the bookings origin `https://bookings.tropical-nomads.com`, and the timetable origin `https://timetable.tropical-nomads.com`.
5. Add base components the web app can render. Do not wait on a Swift or Kotlin toolkit. Ticket 19 does not implement native screens.
6. Version the shared package. The web app depends on a version, not on a pasted folder.
7. Do not copy `public/data/*.json` into the shared repo. Data stays in this monorepo. The shared repo holds shapes.

## Acceptance criteria

- The web app can depend on one version of the shared package.
- The package has a schema entry point that ticket 28 fills.
- The one-pager's `src/theme/palette.ts` and `public/data` are unchanged by the existence of the shared repo.

## Tests

Unit tests live in the shared repo:

- Theme token names used by a sample component contract exist in the token set.
- The schema entry point exports, and the field checks belong to ticket 28.

The implementer runs those tests. They also run `pnpm lint` and `pnpm build` in the one-pager, which must still pass.
