# 03 — Deployment change

**Status:** done as a deploy rule. www still publishes only the one-pager. The new web app, the API host, and the database were not created. No AWS account was connected.

## Outcome

The one-pager still deploys on its own, on its existing Amplify app, to [www.tropical-nomads.com](https://www.tropical-nomads.com). `amplify.yml` pins Node 24.22.2 and pnpm 12.18.0, runs `pnpm install --frozen-lockfile` at the repo root, runs `pnpm --filter tropical-nomads-page build`, and publishes `apps/one-pager/dist`. A change to that package can still be published. The new web app is not given an Amplify app. The API is not given an ECS service. `bookings.tropical-nomads.com` is untouched.

Later hosts, not created here:

- The new web frontend: its own Amplify app, ticket 23.
- The API: a Docker container on ECS, ticket 24.
- The database: confirm Amazon RDS for PostgreSQL, ticket 25. Not a migration.

## Why it exists

`amplify.yml` used to assume the site was the repo root. The one-pager is now `apps/one-pager`. A workspace build of every package would either stop updating www or publish the wrong artifact. The cache headers exist because Amplify's default would keep HTML, the service worker, and JSON for a year. Hashed files under `/assets/**` stay immutable. `apps/one-pager/vite.config.ts` uses `AWS_COMMIT_ID` as the cache-busting query on JSON when the host provides it. Turbo's build task includes that variable, so a cached `pnpm build` keeps it.

## Depends on

- [02 — Repository shape](02-repository-shape.md).

## To-do

### Preserve

1. Point the existing Amplify app at the one-pager package only: Node 24.22.2, pnpm 12.18.0, frozen lockfile, `pnpm --filter tropical-nomads-page build` (`tsc -b && vite build`), and `apps/one-pager/dist`.
2. Keep the `amplify.yml` cache headers: default uncached, `/assets/**` immutable for a year.
3. Keep `AWS_COMMIT_ID` as the build id when the host provides it.
4. Keep the events SEO plugin (it reads `public/data/events.json`) and the PWA manifest and service worker.
5. Keep `pnpm events` / `apps/one-pager/scripts/fetch-goabase-events.mjs` writing the one-pager's `public/data` files.
6. Keep the header link to `https://bookings.tropical-nomads.com`.
7. Keep a path that publishes a one-pager-only change without publishing the API.

### Must not go live

8. Do not create the web app's Amplify app, the ECS service, or a database in this ticket. Those are tickets 23, 24, and 25, and they are not live yet. Do not point www at the new web app.
9. Do not create a public production URL for the API.
10. Do not point www at the web app repo, and do not publish a Next.js output as the www artifact.
11. Do not deploy Bookings, and do not change its host.
12. Do not put operational records into the static artifact.

### Verify

13. The one-pager `dist/` contains `index.html`, hashed assets, `data/*.json`, and the PWA files.
14. A one-pager-only copy change is what `amplify.yml` publishes. This ticket does not publish to www, because it does not connect to AWS.
15. A file that exists only in the API package or in `data/operational` does not show up in `apps/one-pager/dist`.
16. Cache-Control still matches `amplify.yml` for HTML and for `/assets/**`.
17. The bookings link on the built site is still `https://bookings.tropical-nomads.com`.
18. No new public hostname exists for the apps or the API.

## Acceptance criteria

- www's build publishes the one-pager package alone.
- The new web app has no Amplify app and the API has no ECS service. The notes name those as the later hosts.
- Cache headers and the event JSON path behave as they do now.

## Tests

No unit test for Amplify. The implementer runs `pnpm lint` and `pnpm build` in the one-pager package and checks the artifact list above. A live publish to www is not part of this change.
