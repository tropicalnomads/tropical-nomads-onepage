# 21 — Payment decisions still open

**Status:** not started. A list for later. It does not pick a provider and it does not connect one.

## Outcome

The payment questions that are still unanswered are written in one place. Ticket 12 remains the work that happens now: the interfaces, the stub, and the payment-method fields. This ticket does not change those functions and does not install a provider.

## Why it exists

Tickets and merch can be built against the stub while these answers are missing, because a stub charge stays `pending_provider` and does not take money. The answers are still needed before a real charge. Leaving them scattered across tickets makes an early ticket look blocked.

## Depends on

- [12 — Payment interfaces](12-payment-interfaces.md). The list refers to those functions. Nothing else waits on this ticket.

## Decisions to make later

Do not answer them in this ticket. Do not name a company.

1. Which payment company connects to `markPaymentConfirmed`. The interfaces stay as they are until that choice.
2. Which currencies `startPayment` may accept. The shirt on the page is €50. That price is not a decision that the product takes only euros.
3. Ticket types and prices, and the merch price once it is no longer the constant `MERCH_PRICE_EUR`.
4. What a refund and a chargeback do to the trace from `recordRefund`, and whether a cancelled order can still be checked in.
5. Whether a comp or a guest ticket is a payment trace with no charge, or a different kind of issued ticket. Transfers and a second scan stay on the check-in ticket. They are not payment-company choices.
6. When an event leaves Eventbrite, another tickets URL, or Goabase, and when the shirt leaves the WhatsApp reserve. Those links stay until that switch.

## To-do

1. Copy this list into the master plan's payments row so the open items have one home.
2. Do not pick a provider, a currency set, or a price.
3. Do not add a dependency from tickets, merch, or inventory onto this ticket.
4. Do not install a provider SDK.

## Acceptance criteria

- The six items above are recorded as open.
- No provider name was added.
- Ticket 12's functions are unchanged by this ticket.

## Tests

No unit test. The implementer reads this ticket against the master plan and checks the list matches. `pnpm lint` and `pnpm build` in the one-pager still pass, because this ticket does not change the app.
