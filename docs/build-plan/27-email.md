# 27 — Email

**Status:** not started. Sending, templates, and the list of messages. No email vendor.

## Outcome

The product has one way to send email, templates in English and Portuguese, and a fixed list of the messages it sends. Marketing is off until the person consents, and they can stop it. Purchase and QR mail for an order they placed still send after they stop marketing. No vendor is named and no vendor SDK is installed.

## Why it exists

Registration, a purchase, the QR code, and a door invite each need a message in the first product. A new party and an artist offer need the same sender later. Ticket 18 sends the new-party message when an admin publishes. Ticket 22 sends the artist offer. A second sender would split consent and the stop switch.

This ticket sits in the first iteration, after accounts, ticket and shop purchases, and the door invite. The templates for the second iteration are created here. A fixture party id is enough to test them. The first product does not wait for Bookings.

## Depends on

- [09 — Security baseline](09-security-baseline.md). Only an admin may send marketing.
- [10 — Accounts and profile](10-accounts-and-profile.md). Registration, and the address on the account.
- [13 — Tickets](13-tickets.md). The purchase and the QR code.
- [14 — Check-in invites and QR scan](14-check-in.md). The door invite.
- [15 — Shop store](15-shop-store.md). The shop purchase.
- [20 — English and Portuguese](20-internationalization.md). Each template has both languages.

## Messages

Each row has one purpose. The purpose is stored with the template.

| Message | Purpose | Who receives it | Marketing |
| --- | --- | --- | --- |
| Registration | Tell the person their account exists | The new account | No |
| Ticket purchase | Confirm the ticket order | The buyer | No |
| QR code | Give the buyer the code the door scans | The buyer, inside the ticket-purchase message | No |
| Shop purchase | Confirm the shop order | The buyer | No |
| Door invite | Tell an invited person which events they may scan | The invited address | No |
| New party | Announce a party the admin published | An account that consented | Yes |
| Artist offer | Offer Tropical Nomads artists to a party on the integrations list | That party's address, from ticket 22 | Yes |

The QR code is not a second message and not a second secret. It rides in the ticket-purchase message. A shop purchase has no QR code.

Refund mail is not on this list. Ticket 21 still has refunds as an open decision, and no ticket sends one.

## To-do

1. Add a send function the other tickets call. A stub records the template id, the recipient, the language, and the purpose. It does not deliver to a real inbox. Do not name a vendor and do not install a vendor SDK.
2. Store the templates above in English and Portuguese. A missing language fails the send.
3. Record marketing consent separately from creating an account. Registration does not turn consent on. The new-party message and the artist-offer message refuse to send when consent is absent.
4. Give every marketing message a stop control. The stop token is unguessable. It is not the user id and not the public event id. Using it turns marketing consent off. Later marketing sends do not go out. Ticket-purchase, QR, shop-purchase, registration, and door-invite messages are unchanged by that stop.
5. Send the QR only to the buyer address on the account. Do not put the ticket secret in a marketing message, in `public/data`, or in a log line.
6. Only the admin role may send the new-party message or the artist offer. Door and user are denied.
7. Keep recipient addresses and consent out of `public/data`.
8. Do not put vendor credentials in the repo.
9. Tests use a fixture recipient and, for the new-party template, a fixture party id. Do not send to a real address. Do not require the Bookings calendar to exist.
10. Ticket 18 calls the new-party template. Ticket 22 calls the artist-offer template. Do not send those two from this ticket's own screen.

## Acceptance criteria

- The seven rows above are the message list, and the QR code is part of the ticket-purchase message.
- No vendor name and no vendor SDK were added.
- A marketing send without consent is refused.
- Stopping marketing blocks the next new-party send and does not block a ticket-purchase send.
- Door and user cannot send marketing.
- The QR secret is only in the buyer's ticket-purchase message.

## Tests

Unit tests:

- Registration does not set marketing consent.
- New-party send fails when consent is off, and succeeds when it is on.
- The stop token turns consent off. A second new-party send then fails. A ticket-purchase send still succeeds.
- Door and user are denied the marketing send. Admin is allowed.
- The ticket-purchase body contains the QR payload. The new-party body does not.
- A template missing `pt` or `en` fails.

The implementer runs those tests and the one-pager `pnpm lint` and `pnpm build`.
