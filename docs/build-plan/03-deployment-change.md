# 03 — Deployment change

**Status:** not started. Protects www when this repo becomes a monorepo. Does not launch the new apps.

## Outcome

The one-pager still deploys on its own, on its existing Amplify app, to [www.tropical-nomads.com](https://www.tropical-nomads.com). A change to that package can still be published. The new web app is not given an Amplify app yet. The API is not given an ECS service yet. Those are the later hosts, and this ticket does not create them. `bookings.tropical-nomads.com` is untouched.

## Why it exists

`amplify.yml` assumes the site is the repo root. It installs pnpm 9, runs `pnpm install --frozen-lockfile`, runs `pnpm build`, and publishes `dist/`. A workspace root where `pnpm build` builds every package would either stop updating www or publish the wrong artifact. The cache headers exist because Amplify's default would keep HTML, the service worker, and JSON for a year. Hashed files under `/assets/**` stay immutable. `vite.config.ts` uses `AWS_COMMIT_ID` as the cache-busting query on JSON.

Creating other git repositories must not retarget this Amplify app. The owner has named the later hosts: Amplify for the web app, and a Docker container on ECS for the API. This ticket writes that down and does not build either host.

## Depends on

- [02 — Repository shape](02-repository-shape.md).

## To-do

### Preserve

1. Point the existing Amplify app at the one-pager package only: pnpm 9, frozen lockfile, that package's `pnpm build` (`tsc -b && vite build`), and that package's `dist/`.
2. Keep the `amplify.yml` cache headers: default uncached, `/assets/**` immutable for a year.
3. Keep `AWS_COMMIT_ID` as the build id when the host provides it.
4. Keep the events SEO plugin (it reads `public/data/events.json`) and the PWA manifest and service worker.
5. Keep `pnpm events` / `scripts/fetch-goabase-events.mjs` writing the one-pager's `public/data` files.
6. Keep the header link to `https://bookings.tropical-nomads.com`.
7. Keep a path that publishes a one-pager-only change without publishing the API.

### Must not go live

8. Do not create a second Amplify app, a production domain, an ECS cluster, or a Docker service for the new web app or the API. Record the targets in the pipeline notes: web app on Amplify, API container on ECS.
9. Do not create a public production URL for the API.
10. Do not point www at the web app repo, and do not publish a Next.js output as the www artifact.
11. Do not deploy Bookings, and do not change its host.
12. Do not put operational records into the static artifact.

### Verify

13. The one-pager `dist/` contains `index.html`, hashed assets, `data/*.json`, and the PWA files.
14. A one-pager-only copy change shows up on www.
15. A file that exists only in the API package or in a client repo does not show up on www.
16. Cache-Control still matches `amplify.yml` for HTML and for `/assets/**`.
17. The bookings link on the published site is still `https://bookings.tropical-nomads.com`.
18. No new public hostname exists for the apps or the API.

## Acceptance criteria

- www updates from the one-pager package alone.
- The new web app has no Amplify app and the API has no ECS service at the end of this ticket. The notes name those as the later hosts.
- Cache headers and the event JSON path behave as they do now.

## Tests

No unit test for Amplify. The implementer runs `pnpm lint` and `pnpm build` in the one-pager package and checks the artifact list above. They record the www check from a real publish of a one-pager-only change.
