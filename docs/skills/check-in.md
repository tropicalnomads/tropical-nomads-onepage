# Check-in

Ticket 14. Admin and door staff open `apps/web/app/check-in/page.tsx`, pick a published event, and see the tickets sold for it plus the guest lists. Search is by name. The camera uses `@zxing/browser`. The first accepted check-in is the checked tag. The next attempt is refused with `already used`.

The API is `apps/api/src/check-in.ts`. It is not an HTTP route. A sold ticket is admitted only when the trace is `confirmed`. The live stub stays `pending_provider`, so a sold ticket is refused as unpaid. A guest has no payment. Door staff cannot create a guest list. A buyer cannot open the page.

Run `pnpm --filter tropical-nomads-api test` and `pnpm --filter tropical-nomads-web test`. The one-pager build still passes. The web shell is not deployed.

The next ticket must not admit an unpaid ticket, check the same person in twice, put the QR secret on this page, or give door staff the party editor.

## The owner asked

The owner asked for admin and door staff on this page, the sold-ticket list, the camera, name search, one check-in, and guest lists.
