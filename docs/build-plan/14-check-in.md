# 14 — Check-in invites and QR scan

**Status:** not started. Admins invite door staff. Door staff scan QR codes.

## Outcome

An admin can invite a person to check in for one or more events. That person signs in, opens the check-in area, scans a QR code, and the API records the result. A refused ticket does not admit the holder. The door role has no other tool: it cannot create a party, set a description, image, or artists, configure tickets, or add merch, prices, sizes, or stock.

## Why it exists

The owner wants to invite helpers for the door, not to let every buyer scan their own ticket. The scan is a QR code. The current repo has no check-in screen and no invite.

## Depends on

- [05 — Web app repository](05-app-repos.md).
- [10 — Accounts and profile](10-accounts-and-profile.md).
- [13 — Tickets](13-tickets.md).
- [20 — English and Portuguese](20-internationalization.md).

## To-do

1. Admin invites by email, attaching one or more event ids from the shared catalog. The invite grants the door-staff role for those events only. A helper for one party cannot scan another party's tickets.
2. The invited person registers or signs in through Cognito if they do not already have an account. The invite attaches to that profile. Revoking the invite removes the role immediately.
3. The check-in area in the web app scans a QR code, including from a phone browser, and sends the payload to the API. The API checks that the ticket was issued, the secret matches, the event is one this person may scan, and the payment trace is confirmed. Do not build a native scanner. Deny the scan to the admin role and the user role.
4. With the stub provider, confirmed traces do not exist yet, so a scan of a real QR returns unpaid and does not admit. That is success for this ticket, not a broken scanner.
5. Write a private check-in record: ticket, event, time, actor, and result.
6. Show the result to the door staff. Unknown, unpaid, wrong event, or wrong secret does not admit.
7. If transfer and re-entry are still open, record the attempt and do not invent a second-entry policy.
8. Ask whether the door must work offline. This ticket is online only. A later offline mode has to sync into the same check-in record.
9. Keep secrets out of `public/data` and out of the website bundle.
10. Do not add check-in to the one-pager.

## Acceptance criteria

- An admin invite for event A lets that user scan event A and denies event B.
- A user or an admin cannot open a successful scan.
- A door session cannot create a party, configure tickets, or change merch.
- Revoking the invite denies the next scan.
- An unpaid QR is refused.
- A confirmed, matching QR is accepted. The test uses a fixture trace marked confirmed, not the live stub.

## Tests

Unit tests:

- Invite grant is event-scoped.
- Revoked invite denies.
- QR for the right event and a confirmed trace is accepted.
- QR for another event, a bad secret, or `pending_provider` is refused.
- The actor on the check-in record is the invited user, not the buyer.

- Door is denied create-party, configure-event-tickets, and set-merch.

The implementer runs those tests, scans one fixture QR in the web app against the local API, and runs the one-pager build.
