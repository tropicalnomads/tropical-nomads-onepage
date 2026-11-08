# Repository shape

Ticket 2 moved the one-pager to `apps/one-pager` and left empty slots at `apps/api` and `apps/bookings`. Operational JSON is `data/operational`. Ticket 11 put empty collections there. It is not published. The cross-process lock waits. See [private-operational-data.md](private-operational-data.md).

From the repo root, run `pnpm install`, `pnpm lint`, and `pnpm build`. Those commands use pnpm. `pnpm build` builds only `tropical-nomads-page`.

The owner asked for Turborepo and for pnpm. The one-pager already used pnpm. It keeps its Amplify deploy. `amplify.yml` publishes `apps/one-pager/dist` and does not publish the API or Bookings.

The shared client is the package `tropical-nomads-shared` in `packages/shared`. The web shell is `apps/web`. Their GitHub remotes were not created. Still named only: optional `tropical-nomads-ios` and `tropical-nomads-android`.

The next ticket must not deploy the web shell, connect to AWS, create those client repositories, put operational JSON under `public/`, or give the API a public URL.

## Lockfile

The ticket listed `pnpm-lock.yaml` with the files that move. A pnpm workspace keeps one lockfile at the root, and Amplify already runs `pnpm install --frozen-lockfile` there. The lockfile stayed at the root.
