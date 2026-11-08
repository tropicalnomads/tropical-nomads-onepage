# 10 — Accounts and profile

**Status:** screens and profile rules are in. A live Cognito sign-in was not recorded. This environment has no AWS credentials and no Google or Apple secrets. No password and no card number is stored.

## Outcome

The web app has registration, sign-in, and sign-out screens in English and Portuguese, at a phone width and at desktop width. A verified email from a second provider stays on the same profile. Usernames are unique and cannot be a published event id. A disabled profile cannot purchase or scan. The committed profile file is empty. The one-pager has no account screen.

## Depends on

- [04 — Shared client repo](04-shared-client-repo.md).
- [28 — Types and schemas](28-types-and-schemas.md).
- [05 — Web app repository](05-app-repos.md).
- [09 — Security baseline](09-security-baseline.md).
- [20 — English and Portuguese](20-internationalization.md).

## Rules

- The profile uses the shared schema. Registration sets `user`, unless the Cognito sub is `INITIAL_ADMIN_SUB`.
- The store is `data/operational/profiles.json`. It is not an HTTP route and it is not in `public/data`.
- A password is checked only to refuse a weak one, then dropped. It is not written.
- Google and Apple buttons do not accept a subject from the browser. They report that Cognito is not configured.
- Billing can be saved later, with a country. Payment methods stay empty. No payment SDK.
- Avatar bytes, when a signed-in session exists, go under `data/operational/avatars/`, which is gitignored.

## Acceptance

- Email, Google, and Apple are on the registration and sign-in screens, in English and Portuguese, at phone width and at desktop width. A valid form and both provider buttons stop at “Cognito is not configured”. They do not create a profile.
- The profile rules match the shared schema. A verified email keeps one `sub`. A missing username, a missing name, a billing address without a country, and a card number fail in tests. Payment methods stay empty.
- The one-pager has no account screen. Upcoming events still open without a login.

## Tests

`pnpm --filter tropical-nomads-shared test` covers the username, the provider merge, and a disabled account. `pnpm --filter tropical-nomads-api test` covers the empty file and the refused password and card number. `pnpm --filter tropical-nomads-web test` covers the registration checks. The one-pager `pnpm lint` and `pnpm build` still pass.

## Not done

The Cognito user pool, the web app client, and the Google and Apple providers were not created. A sign-in against Cognito was not recorded. Avatar bytes are not uploaded from the screen. The key, when a later session exists, has to stay under `data/operational/avatars/`.
