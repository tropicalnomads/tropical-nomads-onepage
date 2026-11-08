# Web app shell

Ticket 05 adds `apps/web`, package name `tropical-nomads-web`. It is a Next.js shell for a phone or desktop browser. It is not deployed, and it is not www.

The owner asked for the shell in this repository. The planning ticket described a separate GitHub repository. That remote was not created. iOS and Android were not created.

The owner asked for the shell to reuse the one-pager’s design, components, styles, and colors. The shell imports `apps/one-pager/tailwind.config.ts`, `apps/one-pager/src/styles/globals.css`, `apps/one-pager/src/theme/palette.ts`, the Outfit font, the cream logo, and `EmptyState`. It does not keep a second color system. React stays on 18 in this package so the one-pager typecheck still sees one React type set.

The four area ids live in `packages/shared` as `webAreas`. The shared package is version `0.3.0`. The shell imports those ids and the theme tokens. It does not copy event fields. The record schemas live in that package.

From the repo root:

- `pnpm --filter tropical-nomads-web test`
- `pnpm --filter tropical-nomads-web lint`
- `pnpm --filter tropical-nomads-web build`

www still builds with `pnpm --filter tropical-nomads-page build`. `pnpm build` at the root stays on that package. `amplify.yml` is unchanged.

The next ticket must not deploy this shell, connect to AWS, create an Amplify app for it, point www at it, add a language switch, add payment or check-in behavior, create an iOS or Android app, copy event JSON into it, or replace the one-pager’s colors and styles with a second visual system.
