# API

This package is a Hono app. It reads the JSON in `apps/one-pager/public/data` and returns it. It imports `schemas` from `tropical-nomads-shared` and does not keep a second copy. `src/app.ts` exports the app and the `ApiApp` type.

`pnpm start` at the repository root launches this API on `127.0.0.1:3101` and the web app on `127.0.0.1:3100`. The API package loads the root `.env`; without `API_PORT`, its fallback is `8787`. The Node adapter is given the loopback hostname unless `API_HOSTNAME` is `0.0.0.0` for the private ECS task. `DB_STARTUP_CHECK` stays false locally and is true on ECS, where the private RDS endpoint is reachable. The routes are the published catalogs only. There are no ticket, order, payment, or stock routes. Ticket writes are library calls in `src/tickets.ts`, not HTTP routes.

Nothing in this folder is published with the one-pager. `amplify.yml` does not build it. The procedure is [hono.md](../../docs/skills/hono.md).
