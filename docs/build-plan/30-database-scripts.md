# 30 — Database scripts repository

**Status:** not started. Step 25, after the RDS confirmation and before the payment company. This file names the repository and does not create it.

## Outcome

`tropical-nomads-database` is a separate repository for the database. It holds migration scripts, and scripts that seed a new database with the required data. Those seeds are for unit tests, automation tests, and similar uses.

The owner asked for this repository. This file does not create it, and it does not add the scripts to this monorepo.

The recommendation stays Amazon RDS for PostgreSQL in Frankfurt (`eu-central-1`). JSON stays the store until the owner confirms that database. This ticket does not pick a different database.

## Why it exists

The one-pager, the API, Bookings, and the JSON stay in this repository. Migration scripts and seed scripts are a different lifecycle. Ticket 25 confirms the engine and does not migrate. Tests before that confirmation keep using the schemas and the JSON. The scripts repository is the home for the move and the seeds, after that confirmation and before the payment company.

## Impact

- Problem: This monorepo has the JSON store and the schemas, and it has no home for migration scripts or for the data a new database needs in tests.
- Options: Keep those scripts in this monorepo, or put them in a separate database repository.
- Why: The owner asked for a separate repository.

## Depends on

- [01 — Identify the stack](01-identify-stack.md). Amazon RDS for PostgreSQL in Frankfurt is the recommendation. This ticket keeps it.
- [11 — Private operational data](11-private-operational-data.md). Orders, tickets, check-ins, and stock stay JSON until a database is confirmed. Later seeds stand in for those records.
- [25 — Confirm RDS for PostgreSQL](25-rds-recommendation.md). This ticket comes after that confirmation. Ticket 25 does not migrate and does not create the database.
- [28 — Types and schemas](28-types-and-schemas.md). A seed row matches those schemas.

The index does not show an earlier step. Tickets before the confirmation test against JSON and the schemas, and ticket 25 is not a migration. The payment company stays last in the first iteration and does not need these scripts. Bookings stays in the second iteration.

## To-do

1. Name the repository `tropical-nomads-database`. Do not create the GitHub remote in this ticket. Do not add it as a package in this monorepo.
2. That repository holds the migration scripts and the seed scripts. Do not write those scripts here. Do not add a migration tool, a database driver, or any other dependency to this repo.
3. Seed scripts load a new database with the data required for unit tests, automation tests, and similar uses. The rows are synthetic. They are not a copy of a live database, and they are not a second copy of `public/data/`.
4. Security is a requirement on the scripts and on this ticket. A seed contains no real person, no password, no ticket secret, no full card number, no CVC, and no live payment identifier. A sample role is only `admin`, `door`, or `user`. A seed is not a path into the live site.
5. A script contains no connection string, database password, AWS secret, or account id. When a database exists, its credential stays in AWS Secrets Manager. The instance stays private, in Frankfurt, and port 5432 stays open only to the API, as in the AWS record. This ticket does not create that instance and does not open a public port.
6. Keep the engine, the region, and the size already recorded. Amazon RDS for PostgreSQL in Frankfurt (`eu-central-1`) stays the recommendation. The starting size stays one `db.t4g.small` in the AWS record. JSON in this repo stays the store until the owner confirms that database.
7. Do not run a migration. Do not point a script at www, at the one-pager's Amplify app, or at a reachable database.
8. Leave the payment company unnamed, and leave it last in the first iteration. Bookings and the native repositories do not wait on this remote.

## Acceptance criteria

- The build-plan index places this ticket at step 25, after ticket 25 and before ticket 29.
- The repository is named `tropical-nomads-database` and was not created.
- No migration script, seed script, or dependency was added. `package.json` is unchanged.
- The recommendation is still Amazon RDS for PostgreSQL in Frankfurt. No other database was picked. JSON is still the store. No RDS instance was created, and nothing was migrated.
- The ticket requires synthetic seeds, and it keeps passwords, ticket secrets, card numbers, and connection strings out of the repository. It does not open the database to the network.
- www is unchanged. Nothing was deployed.

## Tests

No unit test. The implementer reads this ticket against the build-plan index and checks the position. `pnpm lint` and `pnpm build` in the one-pager still pass, because this ticket does not change the app.
