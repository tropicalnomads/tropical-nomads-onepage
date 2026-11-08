# API

This package reads the JSON in `apps/one-pager/public/data` and returns it. It imports `schemas` from `tropical-nomads-shared` and does not keep a second copy.

`pnpm --filter tropical-nomads-api dev` listens on `127.0.0.1:8787`. That is not a public hostname. The routes are the published catalogs only. There are no ticket, order, payment, or stock routes.

Nothing in this folder is published with the one-pager. `amplify.yml` does not build it.
