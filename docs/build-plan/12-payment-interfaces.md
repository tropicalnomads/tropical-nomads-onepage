# 12 — Payment interfaces

**Status:** done for the interfaces and the stored methods. No payment company is named. A charge stays `pending_provider`.

## Outcome

The API has payment functions for tickets and for merch. A signed-in user can save a billing address and a payment method on the account screen, in English and Portuguese, at phone width and at desktop width. Each attempt can write a private trace. No payment company SDK is installed. A charge does not become paid.

## Depends on

- [09 — Security baseline](09-security-baseline.md).
- [10 — Accounts and profile](10-accounts-and-profile.md).
- [11 — Private operational data](11-private-operational-data.md).
- [28 — Types and schemas](28-types-and-schemas.md).

## Rules

- `startTicketPayment` and `startMerchPayment` both call `startPayment`. The trace status is `pending_provider`. A status sent by the app is ignored.
- `markPaymentConfirmed` does not write and is not called from the web app. `recordRefund` does not write. Refund rules stay open.
- A payment method stores the schema fields. A card number or a CVC is rejected and is not stored. The server chooses the method id and the provider references.
- `startPayment` requires a billing address on an active user profile. The currency on the call is recorded. It is not taken from the shirt price.
- A buyer reads only their own traces. An admin can read traces. Door cannot. Another person's payment methods stay private.
- Eventbrite, Goabase, and the WhatsApp reserve link stay. Traces are not in `public/data`.

## Acceptance

- Tickets and merch both call `startPayment`.
- A stub payment remains `pending_provider`.
- The app cannot mark it confirmed.
- A method containing a full card number is rejected.
- No provider SDK is in any package.

## Tests

`pnpm --filter tropical-nomads-api test` covers both purposes, the ignored confirmed status, the rejected card number, and the missing billing address. `pnpm --filter tropical-nomads-web test` checks the account screen has no card-number field. The one-pager `pnpm lint` and `pnpm build` still pass.
