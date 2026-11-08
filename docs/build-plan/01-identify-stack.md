# 01 — Identify the stack

**Status:** not started. This file records the lean and the work of recommending it. It does not install anything.

## Outcome

A written recommendation the owner can accept or reject. The proposal under test is: Next.js for the new app's web frontend, and AWS for the backend, the database, and the other platform tools. The current one-pager stays the Vite package it is today. API style, the AWS database, auth, the payment provider, and how iOS and Android are produced stay open in that recommendation.

## Why it exists

Later tickets need to know which lean they are building against, and which choices they must not invent. This repo is already specific: a Vite + React 18 + TypeScript site, Tailwind, pnpm, `vite-plugin-pwa`, and an Amplify static build. Treating that stack as the new product's stack would be a guess. Treating Next.js and AWS as already chosen would also be a guess. The owner has named them as the preference to evaluate, because the domain and a lot of the hosting are already on AWS.

In this repo, that AWS footprint shows up as `amplify.yml` and as `AWS_COMMIT_ID` in `vite.config.ts`, which becomes the build id. The Amplify config comment also assumes CloudFront in front of the static files. That is evidence about the current site. It is not a service list for the API or the new app.

The new product is one product for web, iOS, and Android. Next.js, even if accepted for the web frontend, does not by itself produce the iOS and Android apps.

## Depends on

None. This is the first ticket.

## To-do

1. Write the recommendation next to the master plan's stack and cloud rows, dated, and marked as accepted only after the owner says so. Until then the status stays "lean, not decided".
2. State the proposal in one place:
   - Next.js is the candidate for the **new app frontend** (the web UI of the product).
   - AWS is the candidate for the backend, the database, and the other platform tools.
   - The one-pager package stays on Vite, React 18, TypeScript, Tailwind, and pnpm. Do not propose rewriting `src/` into Next.js.
   - JSON files remain the data store. Recommending AWS does not turn on a database in this ticket.
3. Tie the AWS lean to the facts above (`amplify.yml`, `AWS_COMMIT_ID`) and to the owner's reason (domain and hosting already on AWS). Do not audit or invent the rest of the AWS account.
4. Record the three-platform requirement: web, iOS, and Android, one product. List the production choice as still open, with two families and no winner:
   - Shared UI: one interface used on the web and shipped to iOS and Android.
   - Native UI: iOS and Android screens written for those platforms, using the same API as the web app.
   - The one-pager's PWA (`vite-plugin-pwa`, manifest name "Tropical Nomads Events" in `vite.config.ts`) is the current site's install behavior. It is not a vote for either family, and a PWA alone does not finish iOS and Android for the new product.
5. Leave these items named and unanswered in the recommendation. Do not close them in this ticket:
   - API style.
   - Which database service on AWS, if a database is chosen later. No database is chosen here.
   - How people sign in (auth).
   - Payment provider.
   - Which of the two iOS/Android families to use.
   - Languages and markets.
   - Ticket format.
   - Who performs check-in.
6. Also leave the AWS service list open: where an API would run, whether the new app would use Amplify or a different AWS entry, and which account or region. The existing Amplify app keeps building the one-pager only. Do not attach the new app to it in this ticket.
7. Note the constraints any later payment provider has to meet, without naming a company: a trace of buyer, amount, currency, what was bought, status, time, and the provider reference; the browser does not get to mark a payment successful; raw card numbers stay out of our data. The provider itself stays unnamed.
8. Do not add dependencies, scaffold Next.js, or create AWS resources. Identification is a document the owner accepts. Ticket 04 uses Next.js for the web shell only after that acceptance. If the owner rejects the lean, stop and correct tickets 04 and 05 before they start.

## Done when

The owner has either accepted the Next.js and AWS lean or replaced it in writing. The open list in the to-do above is still open. No package was added to `package.json`.
