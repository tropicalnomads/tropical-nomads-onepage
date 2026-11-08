# API reads published data

Ticket 06. `apps/api` is a Hono app. It reads the JSON in `apps/one-pager/public/data` and returns it. The catalogs are events, artists, venues, labels, partners, socials, and agencies. The events body is the stored envelope, including `source.provider`. It is not the result of `parseParty`.

An event is upcoming when `dateStart` is at or after local midnight of the given day. That matches `isUpcomingEvent` in `apps/one-pager/src/lib/data.ts`. The one-pager still fetches `/data/events.json` itself.

The package imports `schemas` from `tropical-nomads-shared`. It does not keep a second field list. A private field such as a ticket secret is refused. Query checks use `hono/validator`. See [hono.md](hono.md).

`pnpm --filter tropical-nomads-api dev` listens on `127.0.0.1` only, port `8787` unless `API_PORT` is set. `serve` sets that hostname. There is no public hostname. `amplify.yml` does not build this package. The web shell is not deployed.

Run `pnpm --filter tropical-nomads-api test` and `pnpm --filter tropical-nomads-api lint`. www still builds with `pnpm --filter tropical-nomads-page build`.

The next ticket must not deploy this API, connect to AWS, give it a public hostname, add ticket, order, payment, or stock routes, call Goabase, or copy the published JSON into another package.
