# 22 — Goabase integrations tab

**Status:** not started. Last product ticket, beside the optional native-repo ticket and after the not-live host tickets. An integrations tab in Bookings. No native app work.

## Outcome

Bookings has an integrations tab whose Goabase data is a list of parties that exist. The team can use that list to email offers of Tropical Nomads artists. The one-pager's public event refresh is unchanged. No iOS or Android work is part of this ticket.

## Why it exists

`scripts/fetch-goabase-events.mjs` already pulls a curated Goabase id list into `public/data/events.json` for the public site. That script is the page's refresh. This ticket is a different job: a database of outside parties, so Bookings can offer Tropical Nomads artists to them. It sits at the end so the catalog, the calendar, and the public site do not wait on it.

## Depends on

- [07 — Shared catalog](07-shared-catalog.md). The artists being offered are the shared artists.
- [17 — Bookings package](17-bookings-package.md). The tab lives in Bookings.
- [27 — Email](27-email.md). The artist offer uses that sender. Do not add a second mailer.

Nothing depends on this ticket. It does not block the admin calendar.

## To-do

1. Add an integrations tab for the admin role only. Door and user cannot open it.
2. Store parties that exist, separately from `public/data/events.json`. A party in this list is not automatically a Tropical Nomads event on www.
3. From that list, let the team email an offer of Tropical Nomads artists. The artist names come from the shared catalog.
4. Keep `scripts/fetch-goabase-events.mjs` and `pnpm events` as the one-pager refresh. Do not delete them here and do not make this tab the writer of the public file.
5. Do not build this tab in the web app, and do not add it to the iOS or Android repos.
6. Do not send email to real addresses in a test. Use a fixture recipient.

## Acceptance criteria

- An admin sees the integrations tab and a party that is not on the public event list. Door and user do not.
- An offer email names artists from the shared catalog and a party from the integrations list.
- `public/data/events.json` is unchanged by saving that party.
- No native screen was added.

## Tests

Unit tests:

- A party saved in the integrations list does not appear in the public events fixture.
- An offer requires a party id from that list and an artist id from the shared catalog. Missing either one fails.
- The public events file is not a valid source for the offer party id.

The implementer runs those tests and the one-pager build.
