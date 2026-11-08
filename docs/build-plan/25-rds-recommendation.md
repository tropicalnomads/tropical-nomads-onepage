# 25 — Confirm Amazon RDS for PostgreSQL

**Status:** not started. Not live yet. A recommendation to confirm. Not a migration.

## Outcome

Amazon RDS for PostgreSQL is still the recommended database, written down for the owner to confirm. JSON remains the store. No instance is created and no file is moved. Confirming or rejecting the recommendation does not make the new app live.

## Why it exists

Orders, tickets, check-ins, stock, users, and the shared catalog are rows that point at each other. A scan and a sale both need a transaction so two requests cannot both succeed. PostgreSQL can hold the current JSON in `jsonb` during a later move. A container on ECS is a normal client of RDS. DynamoDB makes those links harder than this product needs. Aurora is the same engine with capacity this product has not asked for.

The owner asked for this as the database step before a future go-live, and asked that it stay a recommendation. Ticket 11 still uses private JSON.

## Depends on

- [01 — Identify the stack](01-identify-stack.md).
- [11 — Private operational data](11-private-operational-data.md).
- [24 — API container on ECS](24-ecs-backend.md). The database step comes after the container is described. It does not migrate into that container.

Nothing else waits on this ticket.

## To-do

1. Restate the recommendation and the reason above in the master plan. Date it. Status: to confirm.
2. Ask the owner to confirm or reject RDS for PostgreSQL. Do not pick an instance size, Multi-AZ, or a region while waiting.
3. Do not create an RDS instance. Do not open a connection. Do not put credentials in the repo.
4. Do not copy JSON into a database and do not stop ticket 11 from using files.
5. Do not treat a confirmation as permission to point www at the new app.

## Acceptance criteria

- The master plan still says JSON is the store until the owner confirms RDS for PostgreSQL.
- No database instance exists because of this ticket.
- The one-pager deploy is unchanged.

## Tests

No unit test. The implementer re-reads ticket 01, ticket 11, and the master plan and checks they agree. `pnpm lint` and `pnpm build` in the one-pager still pass.
