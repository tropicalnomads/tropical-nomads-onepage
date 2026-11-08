# 28 — Types and schemas

**Status:** not started. Write the shared schemas before any feature ticket. No database and no vendor.

## Outcome

The shared repository from ticket 04 contains a schema for every record in [the models page](../architecture/models.md), and the lookups in [the indexes page](../architecture/indexes.md). The web app, the API, and Bookings use that package. A feature ticket does not invent a field or a second lookup. Open questions stay unfilled.

## Why it exists

Ticket 04 creates the shared repository and the place schemas live. The later tickets name the fields and the ways those features find a row: upcoming parties by date, a profile by email, a ticket by id, stock by product and size, consent by its stop token. Those keys need one list before the feature tickets are built, so each feature does not invent its own.

This ticket is step 5. It is written from the whole plan. It does not wait for those feature tickets to be implemented.

## Depends on

- [04 — Shared client repo](04-shared-client-repo.md). The package exists. This ticket fills it.

## To-do

1. Add a schema for each record on the models page: party, artist, venue, partner, label, agency, calendar entry, profile, billing address, payment method, order, payment trace, issued ticket, check-in, door invite, product, stock count, stock correction, marketing consent, email template, email send, outside party, and artist offer.
2. Use the fields on that page. Do not add a draft flag, a refund record, an allowed-currency list, a fulfillment method, a wallet pass, or a fourth role.
3. Keep published schemas free of ticket secrets, profiles, and payment traces. Reject a payment method that carries a full card number or a CVC.
4. Role is `admin`, `door`, or `user`. Locale is `en` or `pt`. Payment purpose is `tickets` or `merch`. Trace status on this ticket is `pending_provider`.
5. The QR payload schema is issued-ticket id plus secret. A payload that is only the public party id fails.
6. Declare every lookup and unique key on the indexes page. A second row that breaks a unique key fails. A reference to a missing id fails.
7. Do not index the ticket secret, a card number, or a list of every customer. The scan loads a ticket by id and then compares the secret.
8. The API and Bookings import these schemas. They do not keep a second copy. The one-pager's `src/lib/types/event.ts` and `public/data` stay as they are.
9. Do not create RDS, do not install a payment SDK, and do not name an email vendor. The keys are the ones a later database would index. This ticket does not create that database.

## Acceptance criteria

- Every record named on the models page has a schema in the shared package.
- A party missing `dateStart` fails. A party carrying a ticket secret fails.
- A profile missing username or name fails. A payment method with a full card number fails.
- A role other than `admin`, `door`, or `user` fails.
- An artist offer whose party id is a public event id fails.
- The lookups on the indexes page are declared, including the unique keys. The ticket secret is not one of them.
- The one-pager's type files and `public/data` are unchanged.

## Tests

Unit tests in the shared repo:

- A minimal party with `id`, `title`, `dateStart`, `venue`, and `links` parses. Missing `dateStart` fails.
- A party object with a `secret` field fails.
- A profile without username fails. A billing address without country fails.
- A payment method with a 16-digit card number fails.
- A QR payload of ticket id plus secret parses. A payload of only the public party id fails.
- Marketing consent is absent on a new profile fixture. A `new-party` template with `marketing: false` fails. A `ticket-purchase` template with `marketing: true` fails.
- An outside-party id equal to a public party id is rejected as an offer target.
- A second profile with the same username fails. A second stock row for the same product and size fails. Two consent rows for the same subject fail.
- The declared ticket lookup is the ticket id. A key on the secret is rejected.

The implementer runs those tests and the one-pager `pnpm lint` and `pnpm build`.
