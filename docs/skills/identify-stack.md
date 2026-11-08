# Identify the stack

Ticket 1 records the stack in [the master plan](../master-plan.md) and in [ticket 1](../build-plan/01-identify-stack.md). Nothing was installed. The one-pager is unchanged. There is no new tool.

Read those two files and check that they name the same decisions. In this repo, run `pnpm lint` and `pnpm build`. Both should pass.

The next ticket must not install Next.js, rewrite `src/`, connect to AWS, create a cloud resource, store a password, publish a draft party, add a second currency, add shipping, add a refund, add offline check-in, add a wallet pass, name a payment company, change a size in [the AWS record](../devops/aws.md), replace pnpm, or add a fourth product role. AWS resources, when a later ticket creates them, are in Frankfurt (`eu-central-1`). The Turborepo config is not part of this ticket.

## Decisions

The owner asked for each of these.

- The architecture is defined.
- The web app is Next.js.
- The new frontend host is Amplify.
- The API host is a Docker container on ECS.
- The API is REST.
- Login is Amazon Cognito with Google and Apple. Passwords stay in Cognito.
- The languages are English and Portuguese.
- The database recommendation is Amazon RDS for PostgreSQL. JSON stays until that database is confirmed.
- The currency is euro only, for now.
- Merch is pickup for now. Shipping is later.
- There are no refunds.
- A party can be a draft. A visitor cannot read a draft.
- Offline check-in and a wallet pass are later, not in this iteration.
- Every AWS resource is in Frankfurt (`eu-central-1`).
- The payment company is chosen in ticket 29, last in the first iteration. No company is named.
- DevOps is on the building team. They own the AWS sizes and hold the AWS skills. They are not a product role.
- Traffic is about five admins, and parties of about 100–200 people. The sizes are in [the AWS record](../devops/aws.md).
- The monorepo uses Turborepo. Ticket 2 adds the config. See [turborepo.md](turborepo.md).
- Package manager commands use pnpm. The one-pager already uses pnpm.
