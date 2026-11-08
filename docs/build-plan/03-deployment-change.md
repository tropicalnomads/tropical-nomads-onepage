# 03 — Deployment change

**Status:** not started. This ticket is the deploy rule for the monorepo move. It does not launch the new app.

## Outcome

After the one-pager lives inside the monorepo, it still deploys on its own, and a change to it can still be published to [www.tropical-nomads.com](https://www.tropical-nomads.com). The new frontend and the API are not deployed. `bookings.tropical-nomads.com` is untouched by this ticket.

## Why it exists

`amplify.yml` assumes the site is the repo root. It installs pnpm 9, runs `pnpm install --frozen-lockfile`, runs `pnpm build`, and publishes `dist/`. A workspace root where `pnpm build` builds every package, or where `dist/` becomes a Next.js app, would either stop updating the old site or replace www with the new app. The old site has to keep shipping. The new app is not ready to go live, and this ticket is not the launch.

The file also sets cache headers because Amplify's default would keep HTML, the service worker, and JSON for a year at CloudFront. Hashed files under `/assets/**` stay immutable. `vite.config.ts` reads `AWS_COMMIT_ID` for the cache-busting query on JSON. Those behaviors are part of the live site.

## Depends on

- [02 — Monorepo shape](02-monorepo-shape.md). The one-pager has to be a package before the pipeline can aim at that package.

## To-do

### Preserve

1. Keep www on the one-pager package only. The Amplify build (or the same host, if the pipeline file moves with the package) installs that package with pnpm 9 and a frozen lockfile, runs that package's `pnpm build` (`tsc -b && vite build`), and publishes **that package's** `dist/`.
2. Keep the custom headers in `amplify.yml` with the same intent: everything uncached by default, `/assets/**` immutable for a year. Do not let the monorepo change drop those headers.
3. Keep the build-id behavior in `vite.config.ts`: `AWS_COMMIT_ID` when the host provides it, otherwise package version plus a timestamp. JSON requests use that value as `?v=`.
4. Keep the build-time events SEO plugin, which reads `public/data/events.json` and injects JSON-LD, and keep the PWA manifest and service worker the one-pager already emits.
5. Keep `public/data/*.json`, event banners, merch images, and branding in the published artifact.
6. Keep `pnpm events` / `scripts/fetch-goabase-events.mjs` runnable from the one-pager package, writing the same `public/data` files and banners.
7. Keep the header link to `https://bookings.tropical-nomads.com` (`src/components/SiteHeader.tsx`).
8. Keep a path that publishes a one-pager-only change without publishing the frontend package or the API package.

### Must not go live

9. Do not create a production host, domain, Amplify app, or store listing for the new frontend.
10. Do not create a public production URL for the API.
11. Do not point www at the new frontend package, and do not set the published artifact to a Next.js (or other) output directory.
12. Do not deploy the Bookings package in this ticket, and do not change the existing Bookings host.
13. Do not put operational records into the static artifact. None exist yet; do not start.

### Verify

14. From a clean install, the one-pager package build succeeds and its `dist/` contains `index.html`, the hashed assets, `data/*.json`, and the PWA files the current build produces.
15. Publish a trivial one-pager copy change and confirm www serves it.
16. Change a file only in the new frontend slot and confirm www does not serve that change.
17. Confirm response cache headers still match `amplify.yml` for HTML and for `/assets/**`.
18. Confirm `pnpm events` still refreshes the one-pager's `public/data` without a second events file appearing.
19. Confirm the bookings link on the published site is still `https://bookings.tropical-nomads.com`.
20. Confirm there is no new public hostname for the app or the API when this ticket ends.

## Done when

www still updates from the one-pager package alone, the cache headers and event JSON path still behave as they do now, and the new app and API have no production deploy.
