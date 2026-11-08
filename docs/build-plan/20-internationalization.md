# 20 — English and Portuguese

**Status:** done. The web shell switches between English and Portuguese. No third language was added. The web shell is not deployed.

## Outcome

The product languages are English (`en`) and Portuguese (`pt`). Those codes live once in `packages/shared`. The web shell imports them. A visitor can switch in the shell. The choice is stored at `tn:language:v1`. A device language starting with `pt` selects Portuguese, and anything else the normalizer does not recognize selects English.

The one-pager's `src/i18n/` files stay where they are. `public/data` is not translated. Countries and currencies are not decided here.

## Depends on

- [04 — Shared client repo](04-shared-client-repo.md).
- [05 — Web app repository](05-app-repos.md).

## Rules

- The owner asked to reuse the current brand. The switch uses the one-pager's flag buttons, colors, and wording.
- A missing or blank shell label throws. It does not render as an empty string.
- The shell does not keep a second language list.

## Tests

`pnpm --filter tropical-nomads-shared test` covers the two codes and the language choice. `pnpm --filter tropical-nomads-web test` covers the shell labels. The one-pager `pnpm lint` and `pnpm build` still pass.
