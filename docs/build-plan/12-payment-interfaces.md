# 12 — Payment interfaces

**Status:** done for the interfaces and the stored methods. No payment company is named. A charge stays `pending_provider`.

## Outcome

The API has payment functions for tickets and for merch. A signed-in user can save a billing address and a payment method on the account screen, in English and Portuguese, at phone width and at desktop width. Each attempt can write a private trace. No payment company SDK is installed. A charge does not become paid.

A signed-in user can hold payment methods on their profile. Each attempt writes a trace. A charge does not become paid until a provider adapter, added in a later ticket, confirms it.

## Why it exists

The owner wants the payment structure settled and the integration later. Users need payment types for tickets and merch, plus a billing address (ticket 10). The page today does not charge anyone. `getPrimaryTicketUrl` still sends people to Eventbrite, another tickets URL, or Goabase. `MERCH_PRICE_EUR` is 50 and the shop opens WhatsApp. Those stay until a later ticket switches a product over.

## Depends on

- [09 — Security baseline](09-security-baseline.md).
- [10 — Accounts and profile](10-accounts-and-profile.md).
- [11 — Private operational data](11-private-operational-data.md).
- [28 — Types and schemas](28-types-and-schemas.md). The trace and payment-method schemas already exist.

## To-do

1. Define these functions in the API. The trace and payment-method shapes are the schemas from ticket 28. Names can change to match the API style once that is chosen. The jobs cannot:
   - `createCustomer(userId)`
   - `attachPaymentMethod(userId, method)`
   - `listPaymentMethods(userId)`
   - `startPayment({ userId, amount, currency, purpose, reference })` where purpose is `tickets` or `merch`
   - `markPaymentConfirmed(traceId, providerReference)` for the future provider adapter only
   - `recordRefund(traceId)` as an interface, with the refund rules still open
2. Ship a stub adapter. `startPayment` writes a private trace with status `pending_provider`. It does not set `confirmed`. `markPaymentConfirmed` is not callable from the apps.
3. A payment method stores id, type (card, Apple Pay, Google Pay, or other), provider references, brand, last 4, expiry, billing address id, and status. Reject a payload that contains a full card number or CVC.
4. Require a billing address on the profile before `startPayment`. Currency is an argument. Do not assume EUR from the shirt price. Which currencies are allowed is listed on ticket 21. This ticket does not wait for that answer. Accept the currency on the call and record it.
5. The team can read traces. Buyers can read their own.
6. Do not install a provider SDK and do not name a company.
7. Do not remove Eventbrite, Goabase, or the WhatsApp reserve link.
8. Do not put traces in `public/data`.

## Rules

- `startTicketPayment` and `startMerchPayment` both call `startPayment`. The trace status is `pending_provider`. A status sent by the app is ignored.
- `markPaymentConfirmed` does not write and is not called from the web app. `recordRefund` does not write. Refund rules stay open.
- A payment method stores the schema fields. A card number or a CVC is rejected and is not stored. The server chooses the method id and the provider references.
- `startPayment` requires a billing address on an active user profile. The currency on the call is recorded. It is not taken from the shirt price.
- A buyer reads only their own traces on the account page. An admin reads every trace there, with the username and not the subject. Door cannot. Another person's payment methods stay private.
- Eventbrite, Goabase, and the WhatsApp reserve link stay. Traces are not in `public/data`.

## Acceptance criteria

- Tickets and merch both call `startPayment`.
- A stub payment remains `pending_provider`.
- The app cannot mark it confirmed.
- A method containing a full card number is rejected.
- No provider SDK is in any repo or package.

## Tests

Unit tests of the stub:

- `startPayment` for `tickets` and for `merch` returns a trace with amount, currency, purpose, user id, and status `pending_provider`.
- Calling the app-facing surface with `status: confirmed` does not change the stored status.
- `attachPaymentMethod` rejects a 16-digit card number field.
- `startPayment` fails when the profile has no billing address.

`pnpm --filter tropical-nomads-api test` covers both purposes, the ignored confirmed status, the rejected card number, and the missing billing address. `pnpm --filter tropical-nomads-web test` checks the account screen has no card-number field. The one-pager `pnpm lint` and `pnpm build` still pass.
