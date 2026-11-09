# Accounts and profile

Ticket 10. Profile rules live in `packages/shared/src/account/identity.ts`. The private file is `data/operational/profiles.json`, read by `apps/api/src/accounts.ts`. The screens are `/account`, `/account/register`, and `/account/sign-in`.

A new account is `user`. The same verified email keeps one `sub` and gains the second provider. An unverified email does not merge. A disabled profile cannot purchase or scan. The registration screen has no shop, party, or scanner control.

Passwords are not stored. Google and Apple do not trust a subject sent by the browser. Without the pool and client, email sign-in returns `cognito-not-configured` and creates no profile. With those two settings, the password stays on the screen and goes to Cognito `SignUp` and `USER_PASSWORD_AUTH`. An unconfirmed sign-up asks for the emailed code, calls `ConfirmSignUp`, then signs in and writes the profile. `/account/forgot-password` calls `ForgotPassword` and `ConfirmForgotPassword`. A successful sign-in opens `/account`. Google and Apple use the hosted UI only when that provider flag is true; otherwise those buttons return `cognito-not-configured`. See [cognito.md](cognito.md). An active profile can upload a JPEG, PNG, or WebP from `/account`. The bytes stay in `data/operational/avatars/`. Upcoming events stay public.

Run `pnpm --filter tropical-nomads-shared test`, `pnpm --filter tropical-nomads-api test`, and `pnpm --filter tropical-nomads-web test`. The one-pager `pnpm lint` and `pnpm build` still pass. The web shell is not deployed.

Payment methods on the profile keep the last 4 digits. A card number is rejected. See [payment-interfaces.md](payment-interfaces.md).

The next ticket must not put a password or a card number in the profile file, require a login for the upcoming list, or treat a browser-supplied provider subject as verified.

## No local password

The owner asked for Cognito with Google and Apple. A local password hash would be a second identity product, and a subject from the browser would be an account takeover. Email and password use the Cognito API when the pool and client are set. Registration asks for the email, a password, and a matching confirmation. The password needs 8 characters, an uppercase letter, a lowercase letter, a number, and a symbol. After the email is confirmed, `/account/profile` collects the given name and family name. A username is not asked for. The screens still refuse Google and Apple until those provider flags are set. They create a profile only from a verified ID token, including after `ConfirmSignUp`.

## Cognito

Email sign-in uses the deployed pool when `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID` are set. The client has no secret. The password is sent to Cognito and is not stored. A confirmed sign-up, a `ConfirmSignUp` followed by a verified ID token, and a direct password sign-in each write the profile, then set `tn:account:v1` and open `/account`. An unverified email does not. `/account/forgot-password` sends `ForgotPassword` and `ConfirmForgotPassword`, then returns to sign-in. Google and Apple stay unconfigured, so those buttons still return `cognito-not-configured`. The pool id and client id are set at deploy time and are not written into git.
