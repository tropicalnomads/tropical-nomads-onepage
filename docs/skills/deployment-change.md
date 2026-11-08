# Deployment change

Ticket 3 keeps www on the existing Amplify app. The file is `amplify.yml`. It installs pnpm 9.15.9, installs from the root lockfile, runs `pnpm --filter tropical-nomads-page build`, and publishes `apps/one-pager/dist`.

Cache-Control stays uncached for the site, and `/assets/**` stays immutable for a year. `AWS_COMMIT_ID`, when the host sets it, is the JSON cache-buster in `apps/one-pager/vite.config.ts`. Turbo's build task lists that variable so a cached build does not drop it.

The owner asked for the one-pager to keep deploying from the monorepo, and for the new app to stay offline. The web app's Amplify app is ticket 23. The API container on ECS is ticket 24. The database confirmation is ticket 25. None of those were created.

Ticket 4 adds `packages/shared` and does not change this deploy. The web shell is `apps/web` and is not on www. The next ticket must not deploy that shell, connect to AWS, give the API a public URL, point www at another package, or copy `data/operational` into `apps/one-pager/public`.
