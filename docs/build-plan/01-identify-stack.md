# 01 — Identify the stack

**Status:** not started. Records decisions and the remaining lean. It does not install anything.

## Outcome

The stack note matches what the owner has decided, and it still names what is open. Decided: Amazon Cognito for registration and login, with Google and Apple as SSO providers. Decided: separate repositories for the web app, iOS, and Android, plus a shared repo. Still a lean, not a lock: Next.js for the web app, and AWS for the rest of the platform. Still open: API style, which database, which payment company, and which technology compiles the shared UI components.

## Why it exists

Later tickets have to build against Cognito and against four client repositories without pretending the rest of AWS, or a payment company, was chosen. The one-pager is Vite + React 18 + TypeScript + Tailwind + pnpm + `vite-plugin-pwa`, published by `amplify.yml`. `vite.config.ts` reads `AWS_COMMIT_ID`. That is evidence the current site is already on AWS. It is not a reason to rewrite the one-pager in Next.js.

The owner wrote "cognitive". This plan reads that as Amazon Cognito, which supports hosted login plus Google and Apple.

## Depends on

None. This is the first ticket.

## To-do

1. Write the decision record next to the master plan's stack rows, dated 8 November 2026:
   - Registration and login: Amazon Cognito.
   - SSO: Google and Apple, as Cognito identity providers.
   - Passwords stay in Cognito. This product does not store them.
   - The one-pager is not moved onto Cognito in this ticket. The new apps are.
2. Record the repository split: web app, iOS, Android, and a shared repo. This monorepo keeps the one-pager, the API, Bookings, and JSON.
3. Keep Next.js as the candidate for the web app only. Do not install it. Do not rewrite `src/`.
4. Keep these items unanswered:
   - API style.
   - Which AWS database, later. JSON remains the store until then.
   - Which AWS services host the API. The existing Amplify app keeps building the one-pager only.
   - The payment company. Ticket 12 builds interfaces first.
   - The component technology inside the shared repo. Theme tokens, types, schemas, and constants do not need that choice. A button component does, because one source file is not simultaneously a Swift view, a Kotlin view, and a web component. Do not pick React Native, Flutter, or a copy-paste component per repo in this ticket. Leave the choice for the owner before ticket 04 adds real components.
5. Note Apple and Google setup as later work inside ticket 10: an Apple Services ID and a Google OAuth client, both registered on the Cognito user pool. Do not create those accounts now.
6. Do not add dependencies or create AWS resources.

## Acceptance criteria

- The master plan says Cognito, Google, and Apple are decided, and that the payment company, database, and API style are not.
- The note says the one-pager stays on Vite.
- No package was added to `package.json`.

## Tests

No unit test. The implementer re-reads the master plan and this ticket and checks they agree. `pnpm lint` and `pnpm build` in this repo still pass, because this ticket does not change the app.
