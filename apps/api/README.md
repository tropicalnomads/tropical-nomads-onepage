# API

This package is a Hono app. It reads the JSON in `apps/one-pager/public/data` and returns it. It imports `schemas` from `tropical-nomads-shared` and does not keep a second copy. `src/app.ts` exports the app and the `ApiApp` type.

`pnpm --filter tropical-nomads-api dev` listens on `127.0.0.1:8787`. The Node adapter is given that hostname unless `API_HOSTNAME` is `0.0.0.0` for the private ECS task. That is not a public hostname. The routes are the published catalogs only. There are no ticket, order, payment, or stock routes. Ticket writes are library calls in `src/tickets.ts`, not HTTP routes.

Nothing in this folder is published with the one-pager. `amplify.yml` does not build it. The procedure is [hono.md](../../docs/skills/hono.md).
