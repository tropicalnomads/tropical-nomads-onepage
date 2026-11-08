# 12 — Check-in

**Status:** not started. The check-in area validates tickets the product issued. Who stands there is still an open question.

## Outcome

The app has a check-in area, on web, iOS, and Android, that accepts a genuine paid ticket for the right event and records the result. A refused ticket does not admit the holder. The check-in role cannot create tickets, edit the lineup, or change stock.

## Why it exists

A generated ticket still has to be checked at the event. The current repo has no check-in screen and no check-in record. The master plan requires the area, and it refuses to name the person: door staff, the buyer, or someone else. This ticket builds the role's tools and leaves the appointment to the owner.

## Depends on

- [04 — App shell](04-app-shell.md). The check-in area exists on all three platforms.
- [11 — Tickets](11-tickets.md). There is an issued ticket to validate, and the transfer / re-entry answer, if the owner has given one.

## To-do

1. Stop until the owner names who performs check-in. Build the area for that answer. If they say the buyer checks themselves in, the same validation applies and the staff-only label comes off. Do not assume door staff.
2. Ask whether check-in has to work with no network. That question is open. This ticket builds online validation only. An offline mode, if the owner asks for one later, has to sync into the same check-in record so two doors cannot both accept one ticket with the API unaware.
3. From the check-in area, send the presented secret to the API. The API checks that the ticket was issued, matches this event, and matches a confirmed payment from ticket 10. The client does not decide.
4. Apply transfer and re-entry only as ticket 11 recorded them. If those rules are still open, record the attempt and do not invent a second-entry policy. A ticket for a different event fails.
5. Write a check-in record in the private store: ticket, event, time, actor, and result (accepted or the refusal reason).
6. Show the result to the check-in role. Accepted admits. Unknown, unpaid, wrong event, or refused-by-rule does not.
7. Limit the area to the check-in permission from ticket 08. No price edits, no lineup edits, no stock edits, no issuing.
8. Keep the presented secret out of `public/data` and out of logs that ship with the website.
9. Do not add this area to the one-pager. Check-in lives in the app.

## Done when

The person the owner named can check a paid ticket in, and check an unpaid or wrong-event ticket out, on web, iOS, and Android, with a private record of each result, and the actor question is no longer a guess.
