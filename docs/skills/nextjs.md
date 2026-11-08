# Next.js

The web shell uses Next.js in `apps/web`. The one-pager stays on Vite.

Run `pnpm --filter tropical-nomads-web build`. The script sets `NEXT_TELEMETRY_DISABLED=1`. `next.config.ts` turns off `X-Powered-By` and typed routes. The app is not in the root `pnpm build` filter, and `amplify.yml` does not publish it.

React in this package is 18, the same major as the one-pager. A second React type set breaks the one-pager build.
