# 11 — Tickets

**Status:** not started. Purchase-to-ticket for events this product sells. Format stays open until the owner picks it.

## Outcome

A buyer can choose a published event, pay, receive a ticket the product generated, and open that ticket again later. The ticket is tied to that payment and that event. Check-in can be given the ticket in ticket 12. Events that still sell on Eventbrite or Goabase keep those links.

## Why it exists

The site lists parties and then leaves for a ticket. The product has to cover the rest of the path: choose, pay, generate, store, and hand back a ticket the door can validate. A copied event id from `events.json` is not a ticket. The public file's ids (`118352` and the rest) are already world-readable, so the secret presented at the door cannot be that id and cannot be stored in `public/data`.

## Depends on

- [07 — Upcoming events](07-upcoming-events.md). The buyer starts from a real event.
- [10 — Payments](10-payments.md). A ticket is issued only for a confirmed payment.

## To-do

1. Before encoding anything the buyer presents, stop and ask the owner for the ticket format (QR, wallet pass, or another format) and for ticket types and prices. Both are open. Do not pick a format in code while the answer is blank. The rest of this ticket can store the issued ticket and a retrievable record without painting the format.
2. Ask, at the same time, whether the buyer needs an account and how they get the ticket back (in the app, by email, or another channel). Ticket 08 left this open. My Tickets in the app shell is the in-app place. Do not invent the account rule.
3. For an event the owner has switched to in-app sales: create an order, take it through ticket 10's confirmation, then write an issued ticket in the private store. Fields: event id from the shared catalog, the payment trace id, the buyer, a secret the API generated, and the time. The secret is not derived from the public event id.
4. Let the buyer open that ticket again on web, iOS, and Android, using the account answer from step 2.
5. Leave `links.eventbrite`, `links.tickets`, and `links.goabase` on events that are still external. The one-pager keeps using `getPrimaryTicketUrl`. Do not delete those links repo-wide.
6. Ask the owner about comps, guest lists, transfers, re-entry, and cancellation before enforcing "already used". Record every issued ticket so those rules can attach later. A guest or free ticket, if the owner allows one, is still issued by the API and still has a trace.
7. Refuse to issue when the payment trace is not confirmed.
8. Do not write the secret, the buyer, or the order into `public/data/events.json` or any other public file.
9. Do not build the check-in screen here. Ticket 12 consumes the issued ticket.

## Done when

A confirmed payment for a chosen in-app event produces a private issued ticket the buyer can open again on all three platforms, external ticket links still work for events that were not switched, and the format question is answered by the owner or still visibly blocking the encoded presentation.
