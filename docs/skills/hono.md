# Hono

The API in `apps/api` is Hono `4.13.17` with `@hono/node-server` `2.1.6`. The owner chose it on 8 November 2026. The style stays REST. Do not add tRPC, Zod, Fastify, Express, Nest, Elysia, or Encore.

`src/app.ts` exports `api` and the type `ApiApp`. Build the app as one chain so the route types stay on `ApiApp`. A later client can use `hc<ApiApp>` from `hono/client`. Query checks use `hono/validator`. The only query key is `today`, as `YYYY-MM-DD`. `/events/upcoming` and `/events/past` use it. Any other key, a repeated `today`, or a bad date is 400.

Routes are GET. HEAD returns the same status and headers with an empty body. Any other method is 405. An unknown path is 404. A thrown error is 500 `{ error: 'catalog unavailable' }`. The body does not include the file path or a secret.

`src/server.ts` calls `serve` from `@hono/node-server` with `hostname: '127.0.0.1'`. Do not omit `hostname`. The adapter's default listens more widely than loopback. The port is `8787`, or `API_PORT`.

`secureHeaders` sets `X-Content-Type-Options: nosniff`. It does not set `Strict-Transport-Security`, because this listener is HTTP. Turn that header on when the ECS host is HTTPS. `Cache-Control` is `no-store`. There is no `Access-Control-Allow-Origin`.

The events body is the stored file, including `source` and `images`. Do not pass it through `parseParty`. That parser drops those fields. `/events` and `/artists` come from `src/catalog.ts`. See [shared-catalog.md](shared-catalog.md). A private key in a file is refused.

Tests call `api.request()`. Run `pnpm --filter tropical-nomads-api test` and `pnpm --filter tropical-nomads-api lint`.

The next change must not deploy this API, bind `0.0.0.0`, add CORS for every origin, add ticket, order, payment, or stock routes, or install a second schema library.
