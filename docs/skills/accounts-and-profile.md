# Accounts and profile

Ticket 10. Profile rules live in `packages/shared/src/account/identity.ts`. The private file is `data/operational/profiles.json`, read by `apps/api/src/accounts.ts`. The screens are `/account`, `/account/register`, and `/account/sign-in`.

A new account is `user`. The same verified email keeps one `sub` and gains the second provider. An unverified email does not merge. A disabled profile cannot purchase or scan. The registration screen has no merch, party, or scanner control.

Passwords are not stored. Google and Apple do not trust a subject sent by the browser. Without Cognito settings, the buttons return `cognito-not-configured` and create no profile. With the hosted-UI settings, the callback verifies the ID token before `registerVerifiedAccount` and the session cookie. See [cognito.md](cognito.md). An active profile can upload a JPEG, PNG, or WebP from `/account`. The bytes stay in `data/operational/avatars/`. Upcoming events stay public.

Run `pnpm --filter tropical-nomads-shared test`, `pnpm --filter tropical-nomads-api test`, and `pnpm --filter tropical-nomads-web test`. The one-pager `pnpm lint` and `pnpm build` still pass. The web shell is not deployed.

Payment methods on the profile keep the last 4 digits. A card number is rejected. See [payment-interfaces.md](payment-interfaces.md).

The next ticket must not put a password or a card number in the profile file, require a login for the upcoming list, or treat a browser-supplied provider subject as verified.

## No local password

The owner asked for Cognito with Google and Apple. A local password hash would be a second identity product, and a subject from the browser would be an account takeover. The screens still refuse when the hosted-UI settings are absent. They create a profile only from a verified ID token.
