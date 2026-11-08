# Turborepo

Turborepo runs the package tasks in this monorepo. The config is `turbo.json` at the repo root. pnpm remains the package manager.

`pnpm build` and `pnpm lint` call Turbo for `tropical-nomads-page` only. The API and Bookings slots have no build. Do not point the one-pager deploy at another package.
