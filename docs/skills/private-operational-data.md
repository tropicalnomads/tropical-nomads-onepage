# Private operational data

Ticket 11. Orders, payment traces, issued tickets, check-ins, door invites, and stock counts live in `data/operational`. The API code is `apps/api/src/operational.ts`. Those names are not HTTP routes. `publishEvents` returns the public events file unchanged and refuses a ticket secret. Profiles are a separate empty file in the same directory. See [accounts-and-profile.md](accounts-and-profile.md).

The committed files are empty. A write refuses a private key, a card number, and a path outside that directory. `MERCH_STOCK` stays in the one-pager until ticket 16. No database was added.

`operationalWriterLock` is `waiting`. One process orders its own writes. Two processes can still drop an update. Do not invent a database lock here.

Run `pnpm --filter tropical-nomads-api test`, then `pnpm --filter tropical-nomads-page build`, and check that `apps/one-pager/dist` has no `data/operational`.

The next ticket must not put these files under `public/`, add a public route for them, commit a secret, or create Amazon RDS.

## The lock waits

Two sale writes can drop one update. A database lock could have been invented now, or the lock can wait while one process still orders its own writes. The ticket says the locking mechanism waits on the stack. JSON stays the store, and the cross-process lock is not built.
