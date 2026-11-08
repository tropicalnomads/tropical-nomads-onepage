# 14 — Check-in invites and QR scan

**Status:** not started. Admin and door staff open the check-in page. They pick an event, see who was sold a ticket, search by name, and scan a QR code. One check-in is final. Admins keep guest lists.

## Outcome

An admin can invite door staff for one or more published events. Admin and door staff can open the check-in page. A buyer cannot.

On that page they choose one event. Door staff only see events on their invite. An admin can choose any published event. The event shows the tickets sold for it, the guest lists for it, a search by name, and a camera scan. The list does not include the QR secret.

The first successful check-in tags that ticket or guest as checked. A second attempt is refused and does not admit them. A refused ticket does not admit the holder.

An admin can create a guest list for the selected event and add people by name. Those people are checked in from the same page. Door staff can check them in and cannot create or edit the list.

Door staff still have no other tool. They cannot create a party, set a description, image, or artists, configure tickets, or add merch, prices, sizes, or stock.

## Why it exists

The owner wants helpers at the door, and also wants the admin on the same page. The door needs the people who bought tickets, a camera scan, a name search when the code cannot be read, and a way to mark a person so they cannot enter twice. The owner also wants guest lists that an admin creates and that check-in can admit.

## Depends on

- [05 — Web app repository](05-app-repos.md).
- [10 — Accounts and profile](10-accounts-and-profile.md).
- [13 — Tickets](13-tickets.md).
- [20 — English and Portuguese](20-internationalization.md).

## To-do

1. Admin invites by email, attaching one or more published event ids. The invite grants door staff for those events only. A helper for one party cannot open another party's check-in. The message is the door-invite template in ticket 27. This ticket does not choose an email vendor.
2. The invited person registers or signs in through Cognito if they do not already have an account. The invite attaches to that profile. Revoking the invite removes the role immediately.
3. The check-in page is for the admin role and the door role. The user role is denied. Door staff pick an invited event. An admin picks a published event without an invite.
4. The selected event lists the tickets sold for it: the buyer's name, the offer, and whether they are checked. It does not show the secret. Search matches a name on that event only, across buyers and guests.
5. The page scans a QR code with the phone or desktop camera and sends the payload to the API. Do not build a native scanner. The API checks that the ticket was issued, the secret matches, the event is the one on screen, the payment trace is confirmed, and the ticket is not already checked.
6. A name search can check in the chosen person when the code cannot be read. A sold ticket still has to be confirmed and not already checked. A guest does not need a payment trace.
7. With the stub provider, confirmed traces do not exist yet, so a sold ticket stays unpaid and is not admitted. That is success for this ticket, not a broken scanner. The test of a successful ticket scan uses a fixture trace marked confirmed, not the live stub.
8. The first accepted check-in tags that ticket or guest as checked. The next attempt is refused with reason `already used`. Do not admit them again.
9. An admin creates a guest list for one published event and adds people by name. Door staff see that list and can check a person in once. Door staff cannot create or edit a list.
10. Write a private check-in record: the ticket or the guest, the event, the time, the actor, and the result. The actor is the admin or the door user, not the buyer.
11. Show the result. Unknown, unpaid, wrong event, wrong secret, or already checked does not admit.
12. This ticket is online only. A later offline mode has to sync into the same check-in record.
13. Keep secrets out of `public/data` and out of the website bundle.
14. Do not add check-in to the one-pager.

## Acceptance criteria

- An admin invite for event A lets that door user open event A and denies event B.
- An admin can open check-in for a published event. A buyer cannot.
- The event lists its sold tickets without the secret, and a name search finds a buyer or a guest on that event only.
- The first confirmed check-in is tagged checked. The next attempt is refused.
- An admin can create a guest list, add a person, and that person can be checked in once. Door staff cannot create the list.
- A door session cannot create a party, configure tickets, or change merch.
- Revoking the invite denies the next scan.
- An unpaid sold ticket is refused.
- A confirmed, matching QR is accepted once. The test uses a fixture trace marked confirmed, not the live stub.

## Tests

Unit tests:

- Invite grant is event-scoped. Admin check-in does not need an invite. The user role is denied.
- Revoked invite denies.
- The sold-ticket list for the event has names and no secret. Search does not return another event.
- The first confirmed check-in is accepted and tagged checked. The second is refused as already used. The actor is the door user or the admin, not the buyer.
- QR for another event, a bad secret, or `pending_provider` is refused.
- An admin can add a guest. Door staff can check that guest in once and cannot create the list.
- Door is denied create-party, configure-event-tickets, and set-merch.

The implementer runs those tests, scans one fixture QR in the web app against the local API, checks a guest in from the name search, and runs the one-pager build.
