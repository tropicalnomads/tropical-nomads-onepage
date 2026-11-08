# Accounts and profile

Ticket 10. Profile rules live in `packages/shared/src/account/identity.ts`. The private file is `data/operational/profiles.json`, read by `apps/api/src/accounts.ts`. The screens are `/account`, `/account/register`, and `/account/sign-in`.

A new account is `user`. The same verified email keeps one `sub` and gains the second provider. An unverified email does not merge. A disabled profile cannot purchase or scan. The registration screen has no merch, party, or scanner control.

Passwords are not stored. Google and Apple do not trust a subject sent by the browser. The buttons return `cognito-not-configured`. Upcoming events stay public.

Run `pnpm --filter tropical-nomads-shared test`, `pnpm --filter tropical-nomads-api test`, and `pnpm --filter tropical-nomads-web test`. The one-pager `pnpm lint` and `pnpm build` still pass. The web shell is not deployed.

Payment methods on the profile keep the last 4 digits. A card number is rejected. See [payment-interfaces.md](payment-interfaces.md).

The next ticket must not put a password or a card number in the profile file, require a login for the upcoming list, or treat a browser-supplied provider subject as verified.

## Cognito

Email sign-in uses the deployed pool when `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID` are set. The client has no secret. The password is sent to Cognito and is not stored. Google and Apple stay unconfigured, so those buttons still return `cognito-not-configured`. The values are set on the new Amplify app at deploy time and are not written into git.
