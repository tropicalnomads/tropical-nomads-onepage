# Identify the stack

Ticket 1 records the stack in [the master plan](../master-plan.md) and in [ticket 1](../build-plan/01-identify-stack.md). Nothing was installed. The one-pager is unchanged. There is no new tool.

Read those two files and check that they name the same decisions. In this repo, run `pnpm lint` and `pnpm build`. Both should pass.

The next ticket must not install Next.js, rewrite `src/`, connect to AWS, create a cloud resource, store a password, publish a draft party, add a second currency, add shipping, add a refund, add offline check-in, or add a wallet pass.

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

The payment company, and RDS instance size, Multi-AZ, and region, stay unanswered.
