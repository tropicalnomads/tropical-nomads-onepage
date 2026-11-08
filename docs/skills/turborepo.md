# Turborepo

Turborepo runs the package tasks in this monorepo. The config is `turbo.json` at the repo root. pnpm remains the package manager.

`pnpm build` and `pnpm lint` call Turbo for `tropical-nomads-page` only. The build task passes `AWS_COMMIT_ID` through, so the JSON cache-buster matches the host commit. The API and Bookings slots have no build. `amplify.yml` runs `pnpm --filter tropical-nomads-page build` and publishes `apps/one-pager/dist`. Do not point that deploy at another package.
