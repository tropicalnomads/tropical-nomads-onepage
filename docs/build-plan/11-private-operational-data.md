# 11 — Private operational data

**Status:** done. Orders, payment traces, issued tickets, check-ins, door invites, and stock counts are empty JSON files in `data/operational`. No database was created. No secret was written.

## Outcome

The API reads and writes those collections in `data/operational`. That directory is outside `public/` and outside `apps/one-pager/dist`. The published catalog stays in `apps/one-pager/public/data`. `publishEvents` returns that events file unchanged and refuses to attach a ticket secret.

`SHOP_STOCK` stays in the one-pager until ticket 16. Amazon RDS for PostgreSQL is still only a recommendation. Profiles stay out of `public/data`.

## Depends on

- [06 — API reads published data](06-api-reads-published-data.md).
- [09 — Security baseline](09-security-baseline.md).
- [28 — Types and schemas](28-types-and-schemas.md).

## Rules

- The private files are `orders`, `payment-traces`, `issued-tickets`, `check-ins`, `door-invites`, and `stock-counts`. They use the shared schemas. They are not HTTP routes.
- A write refuses a private key or a card number, and a path that leaves `data/operational`.
- One process orders its own writes so two updates in that process both remain. The cross-process lock waits on the stack. This ticket does not invent a database lock.
- The committed collections stay empty. Do not put a secret, a ticket value, or a customer record in git.

## Tests

`pnpm --filter tropical-nomads-api test` covers the empty files, the refused secret, two updates in one process, and the missing public routes. The one-pager `pnpm lint` and `pnpm build` still pass, and `apps/one-pager/dist` does not contain the private files.
