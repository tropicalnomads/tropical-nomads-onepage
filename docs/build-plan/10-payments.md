# 10 — Payments

**Status:** not started. Trace and confirmation rules. No provider is chosen in this ticket.

## Outcome

A ticket order can be paid, and the product stores a trace of what was paid. The trace names the buyer, the amount, the currency, the tickets covered, the status, the time, and the provider's reference. Status changes when the provider confirms them. The app cannot mark an order paid by itself. No card number is stored.

## Why it exists

The page does not take payment. `getPrimaryTicketUrl` sends the visitor to Eventbrite, another tickets URL, or Goabase. Those links stay until ticket 11 cuts an event over. The product still needs its own trace for tickets it sells, because check-in has to know the ticket was paid.

The provider is an open question. Merch payment is a separate open question. Today's shirts are €50 in `MERCH_PRICE_EUR` and are reserved on WhatsApp, which does not set the ticket currency or the provider.

## Depends on

- [08 — Security baseline](08-security-baseline.md).
- [09 — Private operational data](09-private-operational-data.md). Traces go in the private JSON, not in `public/data`.

## To-do

1. Stop and get a provider from the owner before any provider SDK or account keys are added. If they have not chosen, build the trace and the "unpaid / confirmed" states against a fake local confirmation used only in development, and leave the real provider as a plug-in point. Do not name or install a company yourself.
2. Store each ticket charge in the private payment-trace collection with: buyer, amount, currency, tickets covered, status, time, and provider reference. Currency is not assumed from the €50 shirt price. Ask the owner which currencies ticket sales use.
3. Change status only from the provider's confirmation, received by the API. Ignore a browser request that says "paid".
4. Keep the amount on the trace equal to the amount charged. A later price edit does not rewrite the trace.
5. Leave room on the trace for refund and chargeback. The rules for those are open. Do not invent a refund policy. Do not let a status the owner has not defined check in as paid; ticket 12 treats "paid" as the confirmed status only.
6. Give the team an orders view of these traces: who paid, for which event, how much, and the status. Bookings admin and inventory admin are not required to be the same person. Whether the orders reviewer is a separate role is still open; until the owner says, limit the view to the team roles ticket 08 already allows to see money.
7. Do not route merch through this flow unless the owner says the shirt uses the same payment capability. WhatsApp reserve on the one-pager stays as it is.
8. Do not put traces, provider secrets, or card data in `public/data` or in the client bundle.
9. Do not remove Eventbrite or Goabase links from existing events. Ticket 11 decides when an event sells inside the app instead.

## Done when

A development order can move to a confirmed trace only through the API's confirmation path, the trace has the fields above, the team can read it, provider choice is either the owner's named provider or still an explicit open plug-in, and no card data is stored.
