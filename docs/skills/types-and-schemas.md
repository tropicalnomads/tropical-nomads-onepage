# Types and schemas

Ticket 28 fills `packages/shared` version `0.3.0`. The parsers and the lookup list are in `packages/shared/src/schema/`. `apps/api` and `apps/bookings` import `schemas` from that package. Neither ships a server.

The owner asked to reuse the current brand. This ticket does not change the one-pager or the web shell.

Run `pnpm --filter tropical-nomads-shared test` and `pnpm --filter tropical-nomads-shared lint`. The one-pager still builds with `pnpm --filter tropical-nomads-page build`. `amplify.yml` is unchanged.

A published party has no secret field. A payment method rejects a card number and a CVC. Trace status stays `pending_provider`. The ticket lookup is `id`. Currency is a stored string, not an allow-list.

The next ticket must not deploy the web shell, connect to AWS, create a database, name a payment company or an email vendor, add a draft flag, a refund record, a wallet pass, or a fourth role, or index the ticket secret.
