# 29 — Choose the payment company

**Status:** not started. Last ticket of the first iteration, after the not-live host tickets. It does not name a company.

## Outcome

The payment company is chosen here, at the end of the first iteration, and nowhere earlier. This file does not make that choice. No company is named. No payment SDK is installed. No card number is stored.

## Why it exists

Tickets and merch are built against the payment interfaces first. The hosts for the new app are recorded after that, and they are not live. The company is the last choice of the first iteration, so the product path does not wait on a vendor. Bookings does not wait on it either.

## Depends on

- [12 — Payment interfaces](12-payment-interfaces.md). The company connects to those functions.
- [23 — Web app on Amplify](23-amplify-frontend.md), [24 — API container on ECS](24-ecs-backend.md), and [25 — Confirm RDS for PostgreSQL](25-rds-recommendation.md). This ticket sits after those hosts. It does not launch them.

## To-do

1. The owner names the payment company. Do not write a company name into this ticket before that answer.
2. Do not install a provider SDK, and do not put a secret or a card number in the repo.
3. Keep the currency as euro, and keep refunds out. Shipping, offline check-in, and a wallet pass stay later.
4. Do not make Bookings, the calendar, or the Goabase tab wait on this ticket.
5. Any later resource for this company is in Frankfurt (`eu-central-1`). This ticket does not create it.

## Acceptance criteria

- The company is still unnamed.
- The ticket is last in the first iteration, after the Amplify, ECS, and RDS tickets.
- No SDK was added, and `package.json` is unchanged.
- Nothing was deployed, and no AWS resource was created.

## Tests

No unit test. The implementer reads this ticket against the build-plan index and checks the position. `pnpm lint` and `pnpm build` in the one-pager still pass, because this ticket does not change the app.
