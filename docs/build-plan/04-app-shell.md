# 04 — App shell for web, iOS, and Android

**Status:** not started. Shell only. No purchase flow, no check-in logic, no production deploy.

## Outcome

The frontend package runs as one product with a web target, an iOS target, and an Android target. All three open the same areas: upcoming events, my tickets, check-in, and merch. Those areas are empty placeholders. The shell is not on www and not in the app stores.

## Why it exists

The master plan's first product step is to turn the page into a web app that can have an API. The owner has since required that this app be one product for web, iOS, and Android. The shell is that container. Filling it is tickets 07, 11, 12, and 13.

The one-pager is a single scrolling page (`src/app/App.tsx`): hero, upcoming events, past gallery, partners, socials, merch. It is not the app shell, and it already has its own PWA. Copying that page into the new package would mix the marketing site with the product.

## Depends on

- [01 — Identify the stack](01-identify-stack.md). The web UI uses the accepted frontend lean. Next.js is the candidate. If the owner has not accepted it, do not start, and do not install Next.js "just to try".
- [01 — Identify the stack](01-identify-stack.md), again, for how iOS and Android are produced. That choice is still open at the end of ticket 01. This ticket starts by getting it accepted: shared UI, or native UI on the same API. Both keep web, iOS, and Android in scope. Do not pick inside the shell work, and do not start the shell while the choice is blank.
- [02 — Monorepo shape](02-monorepo-shape.md). The frontend slot exists.
- [03 — Deployment change](03-deployment-change.md). www still deploys the one-pager, so adding this package cannot replace it.

## To-do

1. Get the iOS/Android production choice accepted in writing, using the two families from ticket 01. Record it on the master plan's open row when the owner picks. Until that sentence exists, stop.
2. Build the web shell with the accepted frontend. If that is Next.js, it lives in the frontend package only. Do not convert the one-pager package.
3. Add the iOS target and the Android target the accepted family requires. All three targets open the same four areas. A web-only page is not done.
4. Placeholder areas, and nothing behind them yet:
   - Upcoming events (filled in ticket 07).
   - My tickets (filled in ticket 11).
   - Check-in (filled in ticket 12).
   - Merch (filled in ticket 13).
5. Do not add payment, ticket generation, stock edits, or Bookings admin to the shell.
6. Do not add a language list. Leave a single place copy can be translated later. Leave `src/i18n/` on the one-pager as it is (`en` and `pt`).
7. Do not register a production domain, Amplify app, TestFlight, App Store, or Play listing. Local or internal runs only.
8. Do not point `www.tropical-nomads.com` at this package.
9. Do not treat `vite-plugin-pwa` as the way iOS and Android get built. That plugin stays on the one-pager.

## Done when

Web, iOS, and Android each open the four placeholder areas, the production choice for iOS and Android is the one the owner accepted, and www still serves the one-pager.
