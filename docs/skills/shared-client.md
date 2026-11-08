# Shared client

Ticket 4 adds `packages/shared`, package name `tropical-nomads-shared`. The web shell moved it to version `0.2.0` when it added `webAreas`.

The owner asked for the shared client package in this repository. The planning ticket described a separate GitHub repository. A separate remote was not created. `apps/web` depends on this package instead of copying these files.

Run `pnpm --filter tropical-nomads-shared test` and `pnpm --filter tropical-nomads-shared lint`. www still builds with `pnpm --filter tropical-nomads-page build`. `amplify.yml` is unchanged.

The package exports theme tokens, `textView`, the three public origins, `webAreas`, the record schemas, and the language codes `en` and `pt`. It does not contain `public/data`. See [types-and-schemas.md](types-and-schemas.md) and [languages.md](languages.md).

The next ticket must not deploy the web shell, connect to AWS, publish this package to a registry, or copy event JSON into it.
