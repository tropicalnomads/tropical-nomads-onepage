# 18 — Admin party calendar

**Status:** not started. Second iteration. Team calendar inside Bookings admin. The first product does not wait for it.

## Outcome

The admin role can create a party and set its description, image, and artists, then configure that event's ticket offers. The same party is the one the public upcoming list can show. Agendas are still assembled here. Door and user cannot open the editor. Visitors see the published view only.

## Why it exists

Public lineups come from `stages`, `cardArtists`, and the Goabase refresh. There is no admin calendar. Ticket 07 asked what an agenda contains and whether drafts stay off www. This ticket uses those answers.

## Depends on

- [07 — Shared catalog](07-shared-catalog.md).
- [09 — Security baseline](09-security-baseline.md).
- [13 — Tickets](13-tickets.md). Ticket offers use the ticket record. This ticket does not rebuild checkout or the QR code.
- [17 — Bookings package](17-bookings-package.md).
- [27 — Email](27-email.md). Publishing a party uses the new-party template. Do not add a second sender.

## To-do

1. Add the calendar for the admin role only. Create a party with description, image, and artists from the shared catalog. Also keep `title`, `dateStart`, `dateEnd`, `timezone`, and `venue`. Deny create and edit to door and user.
2. Configure that event's ticket offers: name and price on the event, saved with the party. Do not charge a buyer and do not generate a QR code here. Ticket 13 remains the purchase.
3. Assemble an agenda from those parties. What an agenda contains beyond an artist and their parties is still open. If that answer is missing, stop only the agenda part. Creating the party does not wait on it.
4. Save through the API into the shared JSON. Do not keep a second lineup inside Bookings. When the save publishes a party, call the new-party template from ticket 27.
5. The draft rule is still open. Until it is answered, a saved party is public, which matches the events file today.
6. The refresh script rewrites `public/data/events.json` from `EVENT_SOURCES`. Say which writer wins when the calendar and `pnpm events` touch the same id. Do not delete the script. Ticket 22 is the later integrations tab and is not this writer. Do not stop this ticket to wait for it.
7. Do not build checkout, QR check-in, or stock into this calendar. Stock stays on ticket 16.
8. Record who saved a calendar change.
9. Verify on the Bookings host only.

## Acceptance criteria

- An admin can create a party with a description, an image, and artists, attach a ticket offer, save once, and see the published party on the upcoming list.
- Door and user cannot create a party or configure its tickets.
- A draft, if the accepted rule hides drafts, is visible in admin and absent from the public list.
- The save is attributable.

## Tests

Unit tests on fixtures:

- Saving an agenda points at an event id that exists.
- Door and user are denied create-party and configure-event-tickets.
- Until a draft rule is chosen, a saved party is in the public fixture. Once a rule hides drafts, the published filter follows it.
- A second save by another user keeps both actor ids in the change record.

The implementer runs those tests and the one-pager build.
