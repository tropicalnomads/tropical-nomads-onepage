# 31 — AWS as code repository

**Status:** not started. Step 25, with the other not-live host tickets, after the RDS confirmation and before the payment company. This file names the repository and does not create it. It does not create an AWS resource, and it does not call AWS.

## Outcome

`tropical-nomads-aws` is a separate repository for AWS infrastructure as code. Every AWS change is one versioned file in that repository. The file is committed, and the deploy runs from that commit.

The owner asked for this repository. This file does not create it, and it does not add those files to this monorepo.

The first resources are Amazon Cognito with Google and Apple, and Amazon RDS for PostgreSQL in Frankfurt (`eu-central-1`). This ticket names them and does not create them. Multi-AZ is out of scope. JSON stays the store until the owner confirms that database. The one-pager keeps deploying. The new app does not go live.

## Why it exists

The one-pager, the API, Bookings, and the JSON stay in this repository. AWS resources are a different lifecycle. Tickets 23, 24, and 25 name the later hosts and do not launch them. Ticket 25 confirms the engine and does not create the database. This repository is the home for the resource files, with those hosts, before the payment company.

## Impact

- Problem: An AWS change made outside a committed file has no version to review and no commit to deploy from.
- Options: Change the resources in the console, or keep one versioned file per resource in a separate repository and deploy from the commit.
- Why: The owner asked for it.

## Depends on

- [01 — Identify the stack](01-identify-stack.md). Amazon Cognito with Google and Apple, Frankfurt (`eu-central-1`), and Amazon RDS for PostgreSQL are the decisions this ticket keeps.
- [03 — Deployment change](03-deployment-change.md). www keeps deploying the one-pager. The new app does not go live.
- [09 — Security baseline](09-security-baseline.md). Signed-in people stay admin, door, or user.
- [25 — Confirm RDS for PostgreSQL](25-rds-recommendation.md). This ticket comes after that confirmation. Ticket 25 does not create the database and does not migrate.

The index places this ticket with the not-live hosts. Ticket 30 stays the scripts repository after this ticket. The payment company stays last in the first iteration. Bookings stays in the second iteration.

## To-do

1. Name the repository `tropical-nomads-aws`. Do not create the GitHub remote in this ticket. Do not add it as a package in this monorepo.
2. That repository holds one versioned file per AWS resource. A change is a commit of that file. A deploy uses that commit. Do not write those files here. Do not add an infrastructure tool, an AWS SDK, or any other dependency to this repo. This ticket does not choose the tool.
3. The first files, when that repository is created later, are Amazon Cognito with Google and Apple, and one Amazon RDS for PostgreSQL instance in Frankfurt (`eu-central-1`). Do not create those resources in this ticket. Do not call AWS.
4. Security is a requirement on the files and on this ticket. A file contains no password, no Google or Apple client secret, no database password, no connection string, no account id, and no card number. Passwords stay in Cognito. When a database exists, its credential stays in AWS Secrets Manager. The instance stays private, in Frankfurt, and port 5432 stays open only to the API, as in the AWS record. This ticket does not create that instance and does not open a public port.
5. Cognito stays one user pool and one web app client, as in the AWS record. The roles in that pool are only `admin`, `door`, and `user`. Google and Apple are the sign-in providers. Do not create those provider accounts.
6. Multi-AZ is out of scope. The database stays one instance. The starting size stays one `db.t4g.small` in the AWS record. The two private subnets in that record stay a subnet group for that one instance. JSON in this repo stays the store until the owner confirms the database. This ticket does not migrate.
7. Keep the one-pager on its existing Amplify app. Do not change `amplify.yml`. Do not point www at the new app. Do not launch the web app, the API, or the database. The new app does not go live.
8. Leave the payment company unnamed, and leave it last in the first iteration. Bookings and the native repositories do not wait on this remote.

## Acceptance criteria

- The build-plan index places this ticket at step 25, with the not-live host tickets, after ticket 25 and before ticket 30 and ticket 29.
- The repository is named `tropical-nomads-aws` and was not created.
- No infrastructure file, AWS SDK, or other dependency was added. `package.json` is unchanged. No tool was chosen.
- Cognito with Google and Apple, and Amazon RDS for PostgreSQL in Frankfurt, are named and were not created. Multi-AZ was not added. JSON is still the store. Nothing was migrated.
- The ticket keeps passwords, provider secrets, account ids, and connection strings out of the repository. It does not open the database to the network. It does not call AWS.
- www is unchanged and still deploys the one-pager. The new app was not launched. Nothing was deployed.

## Tests

No unit test. The implementer reads this ticket against the build-plan index and checks the position. `pnpm lint` and `pnpm build` in the one-pager still pass, because this ticket does not change the app.
