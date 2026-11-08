# 01 — Identify the stack

**Status:** done as a decision record on 8 November 2026. It does not install anything, connect to AWS, or migrate data.

## Outcome

The stack note matches what the owner decided on 8 November 2026. The architecture is defined. The new app is not launched.

Decided: Amazon Cognito with Google and Apple. Next.js for the web app. Amplify for the new frontend. A Docker container on ECS for the API. REST. English and Portuguese. Euro only, for now. Merch is pickup for now, and shipping is later. There are no refunds. A party can be a draft. Offline check-in and a wallet pass are later, and they are not in this iteration. Phones use the web app in the browser. iOS and Android repos stay optional and last.

Recommendation, not created: Amazon RDS for PostgreSQL. JSON stays the store until that database is confirmed.

Region: every AWS resource is in Frankfurt (`eu-central-1`). None are created here.

The payment company is chosen in [ticket 29](29-payment-company.md), last in the first iteration, after the not-live hosts. This ticket does not name a company.

Still open: RDS instance size.

## Why it exists

Later tickets have to build against Cognito, Amplify, and ECS without pretending a payment company was chosen, and without throwing away the JSON store. The one-pager is Vite + React 18 + TypeScript + Tailwind + pnpm + `vite-plugin-pwa`, already published by `amplify.yml`. `vite.config.ts` reads `AWS_COMMIT_ID`. That is the current site. It is not a reason to rewrite the one-pager in Next.js.

The owner wrote "cognitive". This plan reads that as Amazon Cognito, which supports hosted login plus Google and Apple.

## Database recommendation

Recommend Amazon RDS for PostgreSQL. The owner still has to confirm it. This ticket does not create the database and does not move JSON into it.

Why this engine fits:

- Users, billing addresses, orders, tickets, check-ins, stock counts, events, artists, and agendas are rows that point at each other. Bookings and the web app share those rows.
- A ticket scan and a merch sale both need a transaction, so two requests cannot take the last unit or accept the same ticket.
- PostgreSQL can store the current JSON documents in `jsonb` during a later move, so the file shapes do not need a second database.
- The API is a container on ECS, which is a normal client of RDS on a private network.
- DynamoDB makes those links and the single-decrement update harder than this product needs.
- Aurora PostgreSQL is the same engine with capacity this product has not asked for. Instance size stays open.

JSON files remain the store until the owner confirms this recommendation. Ticket 11 still builds the private JSON location.

## Depends on

None. This is the first ticket.

## To-do

1. Write the decision record next to the master plan's stack rows, dated 8 November 2026. The owner defined the architecture:
   - Registration and login: Amazon Cognito, with Google and Apple.
   - Passwords stay in Cognito. This product does not store them.
   - Web app: Next.js. Do not install it. Do not rewrite `src/`.
   - Web frontend host, when launch is allowed: Amplify. The one-pager already has its own Amplify app. The new web app does not join that app in this ticket.
   - API host, when launch is allowed: a Docker container on ECS. Do not create the cluster now.
   - API style: REST.
   - Languages: English and Portuguese.
   - Currency: euro only, for now.
   - Merch: pickup for now. Shipping is later.
   - Refunds: there are none.
   - A party can be a draft. A draft is not on the public list and is not readable by a visitor.
   - Offline check-in and a wallet pass are later. They are not in this iteration.
   - Phones use the web app in the browser. Ticket 19 may create iOS and Android repos later. It does not implement native apps.
   - Database recommendation: Amazon RDS for PostgreSQL, with the reasons above. Status: to confirm. JSON stays until then.
   - Region: Frankfurt (`eu-central-1`) for every AWS resource. Do not create those resources here.
   - The payment company is chosen in ticket 29, after the not-live hosts. Do not name a company here.
2. Record the repository split: shared repo and web app repo are required. iOS and Android repos are optional. This monorepo keeps the one-pager, the API, Bookings, and JSON.
3. Do not install Next.js. Do not rewrite `src/`.
4. Keep RDS instance size unanswered.
5. Do not block the shared repo on a native component toolkit. The web app can use web components from the shared package. Native screens are out of scope.
6. Note Apple and Google setup as later work inside ticket 10: an Apple Services ID and a Google OAuth client on the Cognito user pool, for the web app client. Do not create those accounts now.
7. Do not add dependencies, create AWS resources, connect to AWS, or migrate data.

## Acceptance criteria

- The master plan says the architecture is defined: Cognito, Next.js, Amplify for the web frontend, ECS for the API container, and REST. The new app is not launched by this ticket.
- The master plan records Amazon RDS for PostgreSQL as the recommendation to confirm, and JSON as the store until then.
- The master plan records euro, pickup for now, no refunds, draft parties, and offline check-in and a wallet pass as later.
- The master plan records Frankfurt (`eu-central-1`) for every AWS resource, and ticket 29 as the payment-company choice. No company is named.
- RDS instance size is still open.
- No package was added to `package.json`. No RDS instance exists. No AWS account was connected.

## Tests

No unit test. The implementer re-reads the master plan and this ticket and checks they agree. `pnpm lint` and `pnpm build` in this repo still pass, because this ticket does not change the app.
