# 20 — English and Portuguese

**Status:** not started. Product languages are decided. This ticket wires them into the web app. It does not add a language.

## Outcome

The web app is in English and Portuguese, and the visitor can switch. The one-pager already does this. Its translations stay where they are. No third language exists.

## Why it exists

The owner decided the product is English and Portuguese, with internationalization. `src/i18n/translations.ts` already types `Language` as `'en' | 'pt'`. `src/i18n/language.ts` stores the choice at `tn:language:v1`, treats a device language starting with `pt` as Portuguese and `en` as English, and falls back to English. Later screens have to use that pair. They should not each invent a language list, and they should not ship as English only.

Party names, artist names, and other catalog text stay the strings in the JSON. This ticket translates the product's own interface, the way the one-pager already translates its chrome.

## Depends on

- [04 — Shared client repo](04-shared-client-repo.md). The language codes live with the shared constants.
- [05 — Web app repository](05-app-repos.md). The switch sits in the shell, before upcoming events and the other screens.

## To-do

1. Record the decision: the product languages are English (`en`) and Portuguese (`pt`). Do not add another code.
2. Put those two codes in the shared package. The web app imports them. It does not keep a second list.
3. In the web app, switch language the way the one-pager does: remember `tn:language:v1`, honor a device language of English or Portuguese, and default to English.
4. Put the shell's own labels, including the four area names, in both languages.
5. Leave `src/i18n/` on the one-pager unchanged. Do not move those files into the web app and do not delete them.
6. Do not translate `public/data` records.
7. Do not decide countries or currencies here. Currencies are on the payment-decisions ticket.

## Acceptance criteria

- A visitor can use the web app shell in English and in Portuguese.
- The only language codes are `en` and `pt`.
- The one-pager's `src/i18n/` files are unchanged.
- A missing translation key fails a test rather than showing a blank label.

## Tests

Unit tests:

- `en` and `pt` are the only accepted codes. Any other code is rejected.
- A stored `pt` value selects Portuguese. A missing stored value with a device language starting with `pt` selects Portuguese. Anything else the normalizer does not recognize selects English.
- Every shell label that exists in English exists in Portuguese.

The implementer runs those tests and the one-pager `pnpm lint` and `pnpm build`.
