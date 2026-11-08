# 13 — Tickets

**Status:** done for the unpaid in-app ticket. A signed-in buyer with a billing address can hold a QR ticket for a published party with a euro offer. The trace stays `pending_provider`. The ticket is not valid for entry. No payment company is named.

## Outcome

A signed-in buyer with a billing address can choose a published event, start a payment through ticket 12, and receive a ticket the API generated. The ticket can be opened again in the web app, including on a phone. The code the door scans is a QR code of that ticket. Events that still sell on Eventbrite or Goabase keep those links. Because the provider is not connected yet, the issued ticket stays tied to a `pending_provider` trace and is not valid for entry until confirmation exists. The QR can still be generated so the path is real.

## Why it exists

The site lists parties and then leaves. The product has to generate a ticket, store it privately, and hand the buyer a QR code. Public event ids in `events.json` are world-readable, so the QR secret cannot be that id.

## Depends on

- [08 — Upcoming events](08-upcoming-events.md).
- [12 — Payment interfaces](12-payment-interfaces.md).
- [20 — English and Portuguese](20-internationalization.md).

## To-do

1. Do not charge a real amount. Ticket types, prices, and the provider are listed on ticket 21, and this ticket does not wait on them. The QR format is decided. A wallet pass on top of the QR is still open. Do not build a wallet pass in this ticket.
2. For an event switched to in-app sales: create an order, call `startPayment` with purpose `tickets`, and write an issued ticket in the private store: event id, trace id, buyer id, a secret the API generated, and the time.
3. The QR payload is the ticket id plus the secret. It is not the Goabase id alone. Render that QR in the web app from the shared payload schema. A phone browser has to show it large enough to scan.
4. The buyer opens the ticket again from My Tickets in the web app, signed in.
5. Mark the ticket `payable` only. Door validation in ticket 14 accepts it only after the trace is confirmed. With the stub adapter, a scan must refuse it as unpaid. That is the correct result until a provider is connected.
6. Leave external links on events that are not switched. The one-pager keeps `getPrimaryTicketUrl`.
7. Record every issued ticket. Guest lists and a second check-in are decided on ticket 14: an admin guest list can be checked in, and a checked ticket cannot be checked in again. Transfers and cancellation stay open.
8. Do not write the secret into `public/data`.

## Acceptance criteria

- A signed-in buyer with a billing address can hold a ticket and a QR code for a switched event.
- The QR payload does not equal the public event id.
- A stub payment leaves the ticket unpaid, and the unpaid ticket is not a successful entry.
- External ticket links still resolve for events that were not switched.

## Tests

Unit tests:

- Secret generator output is not the event id and is not derived by concatenating the event id with the user id.
- QR payload parse returns ticket id and secret, and rejects a payload that is only the public event id.
- Issue refuses a profile with no billing address.
- Issue linked to `pending_provider` is stored as not valid for entry.

The implementer runs those tests and the one-pager build.
