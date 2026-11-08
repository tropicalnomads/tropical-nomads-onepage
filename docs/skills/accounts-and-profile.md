# Accounts and profile

Ticket 10. Profile rules live in `packages/shared/src/account/identity.ts`. The private file is `data/operational/profiles.json`, read by `apps/api/src/accounts.ts`. The screens are `/account`, `/account/register`, and `/account/sign-in`.

A new account is `user`. The same verified email keeps one `sub` and gains the second provider. An unverified email does not merge. A disabled profile cannot purchase or scan. The registration screen has no merch, party, or scanner control.

Passwords are not stored. Google and Apple do not trust a subject sent by the browser. The buttons return `cognito-not-configured`. Upcoming events stay public.

Run `pnpm --filter tropical-nomads-shared test`, `pnpm --filter tropical-nomads-api test`, and `pnpm --filter tropical-nomads-web test`. The one-pager `pnpm lint` and `pnpm build` still pass. The web shell is not deployed.

The next ticket must not put a password or a card number in the profile file, require a login for the upcoming list, or treat a browser-supplied provider subject as verified.

## Cognito is not called

The ticket asks for a Cognito user pool with Google and Apple, and this environment has no AWS credentials and no provider secrets. A local password hash, or a button that trusts a subject from the browser, would have produced a sign-in. A local hash is a second identity product, and a browser-supplied subject is an account takeover. The screens check the fields and then refuse.
