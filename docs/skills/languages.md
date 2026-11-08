# English and Portuguese

Ticket 20. The only language codes are `en` and `pt`. They are `locales` in `packages/shared`, now version `0.4.0`. The web shell imports that list. It does not keep another one.

The shell remembers `tn:language:v1`. A stored `pt` selects Portuguese. With nothing stored, a device language starting with `pt` selects Portuguese. Anything else the normalizer does not recognize selects English.

The owner asked to reuse the current brand. The switch uses the same flag buttons and colors as the one-pager. Shell labels, including the four area names, the upcoming-event labels, the account labels, and the payment labels, are in both languages. Event titles stay the catalog strings. `apps/one-pager/src/i18n/` is unchanged. `public/data` is not translated.

Run `pnpm --filter tropical-nomads-shared test` and `pnpm --filter tropical-nomads-web test`. www still builds with `pnpm --filter tropical-nomads-page build`. `amplify.yml` is unchanged. The web shell is not deployed.

The next ticket must not deploy the web shell, connect to AWS, add a third language, translate `public/data`, or decide countries or currencies.
