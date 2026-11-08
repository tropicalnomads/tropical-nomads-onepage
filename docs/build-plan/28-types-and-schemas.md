# 28 — Types and schemas

**Status:** done. The schemas and lookups live in `packages/shared` at version `0.3.0`. No database was created. No payment SDK was installed. No email vendor was named.

## Outcome

`tropical-nomads-shared` has a schema for every record on the models page, and the lookups from the indexes page. The API slot and the Bookings slot import that same object. They do not keep a second copy. The web shell already depends on this package and its screens are unchanged.

Open questions stay unfilled: no draft flag, no refund record, no allowed-currency list, no fulfillment method, no wallet pass, and no fourth role. The owner already decided a party can be a draft. This ticket does not add that field.

## Depends on

- [04 — Shared client repo](04-shared-client-repo.md).

## Rules

- Role is `admin`, `door`, or `user`. Locale is `en` or `pt`. Payment purpose is `tickets` or `merch`. Trace status is `pending_provider`.
- A published party rejects a ticket secret. A payment method rejects a full card number and a CVC.
- The QR payload is issued-ticket id plus secret. A payload that is only a public party id fails.
- Unique keys reject a second row. A reference to a missing id fails.
- The ticket lookup is the ticket id. The secret is compared after that load. It is not a lookup.
- `apps/one-pager/src/lib/types/event.ts` and `public/data` are unchanged.
- The one-pager colors and the web shell stay as they are. The owner asked to reuse that brand.

## Tests

`pnpm --filter tropical-nomads-shared test` covers the party, profile, billing address, card number, QR payload, template marketing flags, outside-party id, unique keys, and the ticket lookup. The one-pager `pnpm lint` and `pnpm build` still pass.
