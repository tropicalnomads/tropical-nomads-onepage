# 06 — API reads published data

**Status:** done. The API reads the one-pager's published JSON on `127.0.0.1`. It has no public hostname. It is not in `amplify.yml`.

## Outcome

`apps/api` returns the JSON the one-pager already publishes. The events response is the stored envelope: `schemaVersion`, `generatedAt`, `source`, `count`, and `events`. `source.provider` stays `goabase`. The one-pager still fetches `/data/events.json` itself.

The API does not write tickets, payments, stock, or events. It does not call Goabase. Refresh stays `scripts/fetch-goabase-events.mjs`.

## Depends on

- [02 — Repository shape](02-repository-shape.md).
- [03 — Deployment change](03-deployment-change.md).
- [28 — Types and schemas](28-types-and-schemas.md). The API imports `schemas` from `tropical-nomads-shared` and does not keep a second field list.

## Rules

- The only files are `events`, `artists`, `venues`, `labels`, `partners`, `socials`, and `agencies` in `apps/one-pager/public/data`.
- An event is upcoming when `dateStart` is at or after the start of the given day in the process local timezone. That is the same rule as `isUpcomingEvent` in `apps/one-pager/src/lib/data.ts`. An event that starts later that day is upcoming. An event that started before that midnight is past.
- A ticket secret, a card number, or a password in a published file is refused. The response does not add one.
- The listener is `127.0.0.1` only. There is no public host and no ticket, order, payment, or stock route.

## Tests

`pnpm --filter tropical-nomads-api test` covers the upcoming filter, the events envelope, and the loopback listener. The one-pager `pnpm lint` and `pnpm build` still pass.
