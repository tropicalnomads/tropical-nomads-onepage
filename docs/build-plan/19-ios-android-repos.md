# 19 — iOS and Android repositories

**Status:** optional. Last. Not required for the web product. Creates the two repositories only. Does not implement native apps.

## Outcome

Empty iOS and Android repositories exist and can depend on the shared package from ticket 04. They contain no screens, no check-in scanner, and no store listing. Phones keep using the web app in the browser.

## Why it exists

The owner still wants a repo per native platform, plus the shared repo. That work is deprioritized. It must not sit in front of events, accounts, tickets, or check-in. This ticket is the place those repos get created when someone chooses to do it. It is not a native implementation plan.

## Depends on

- [04 — Shared client repo](04-shared-client-repo.md). The repos point at that package. They do not block the web app, and the web app does not wait for them.

Nothing else depends on this ticket.

## To-do

1. Create the two repositories. Do not nest them inside `tropical-nomads-onepage`.
2. Add a README in each that says the native app is not being built, and that phones use the web app in the browser.
3. Point each repo at the shared package version for types and tokens only. Do not add native screens that render those types.
4. Do not add a camera, a QR scanner, Cognito app clients, or a payment call in these repos.
5. Do not create an App Store or Play listing, TestFlight, or a production hostname.
6. Do not change the one-pager, the web app, or `amplify.yml`.

## Acceptance criteria

- The two repositories exist and contain no application screens.
- Each README states that the phone product is the web app in the browser.
- www and the web app are unchanged by this ticket.

## Tests

No unit test. The implementer confirms each repo has no screen source and that the one-pager `pnpm lint` and `pnpm build` still pass.
