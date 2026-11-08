# Tickets

Ticket 13. `apps/api/src/tickets.ts` issues one ticket for a published party that has a euro offer. The buyer id is the Cognito `sub` on the session cookie `tn:account:v1`. The call is `startTicketPayment` with currency `EUR`. The trace stays `pending_provider`. `validForEntry` stays false. The web app shows the QR again on `/my-tickets`.

Run `pnpm --filter tropical-nomads-api test` and `pnpm --filter tropical-nomads-web test`. The one-pager `pnpm lint` and `pnpm build` still pass. The web shell is not deployed.

The next ticket must not mark the trace confirmed, call `recordRefund`, scan the QR, send the purchase email, or publish a party from this purchase.

## Euro, no refund, unpublished parties

The owner asked for euro only, no refunds, and for a party to stay a draft until it is published. No payment company is named.

## What counts as switched

The problem: this ticket sells a switched party and does not wait for the admin editor.
The options: add a private switch list, or use a euro offer already on the published party.
The published party schema already has offers, the live events file has none, and the purchase currency is euro. A party that is not in the published file is refused and is not created.
