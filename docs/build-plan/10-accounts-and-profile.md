# 10 — Accounts and profile

**Status:** screens and profile rules are in. A live Cognito sign-in was not recorded. This environment has no AWS credentials and no Google or Apple secrets. No password and no card number is stored.

## Outcome

The web app has registration, sign-in, and sign-out screens in English and Portuguese, at a phone width and at desktop width. A verified email from a second provider stays on the same profile. Usernames are unique and cannot be a published event id. A disabled profile cannot purchase or scan. The committed profile file is empty. The one-pager has no account screen.

The product still asks for a person to register and sign in on the web app, including in a phone browser, with an email and password, with Google, or with Apple. The API stores a profile for that Cognito user: name, username, avatar, billing address, and payment-method slots. Passwords and raw card numbers are not in our JSON. Native app clients are not created in this ticket.

## Why it exists

Tickets, merch, and door invites need a real user. The current site has no accounts. Language choice is only `tn:language:v1` in the browser. The owner asked for Cognito plus Google and Apple, and for a profile rich enough to pay for tickets and merch later.

## Depends on

- [04 — Shared client repo](04-shared-client-repo.md). The shared package exists.
- [28 — Types and schemas](28-types-and-schemas.md). The profile schema is already written there.
- [05 — Web app repository](05-app-repos.md). The sign-in screen is in the web app.
- [09 — Security baseline](09-security-baseline.md). Roles exist before the first admin invite.
- [20 — English and Portuguese](20-internationalization.md). The profile locale is one of those two codes.

## Profile to store

The owner named name, username, avatar, billing address, and payment types. These are the fields that set needs, plus the fields Cognito and the product cannot do without.

Identity:

- Cognito subject (`sub`), the stable id. Apple's private relay means email is not the only key.
- Email, verified. Unique.
- Username, chosen by the person, unique, shown in the app. Separate from email.
- Given name and family name. The billing name can differ, so billing name lives on the address.
- Display name, optional, defaulting to the given name.
- Avatar image reference (stored file key), not a password and not a card.
- Phone number, optional, E.164. The one-pager's WhatsApp shop number is not copied in as this field.

Sign-in links:

- Provider: Cognito password, Google, or Apple, with that provider's subject.
- A person who uses Apple and later Google on the same verified email lands on one profile. Matching is by verified email, and the Cognito subject remains the id.

Billing:

- One default billing address: recipient name, line 1, line 2, city, region, postal code, country.
- Room for another address later. Do not build a full address book in this ticket.

Payment methods, structure only (ticket 12 owns the functions):

- Id, type (card, Apple Pay, Google Pay, or other), provider customer reference, provider method reference, brand, last 4, expiry month and year, billing address id, status.
- No card number, no CVC.

Account:

- `createdAt`, `updatedAt`.
- Status: active or disabled.
- Role: `user`, `door`, or `admin`. Registration sets `user`. Ticket 14 grants `door`. The owner account is the first `admin`, from configuration, not from a password stored in the repo.
- Locale preference, optional, and only `en` or `pt`. The product languages are already decided.

Leave date of birth out unless the owner says events are age-restricted. Do not collect it "just in case".

## To-do

1. Create the Cognito user pool and a web app client when this ticket is implemented. Enable Google and Apple as identity providers. Do this in the owner's AWS account, not in the one-pager repo. Do not create iOS or Android app clients.
2. Registration collects email, password (or a federated identity), username, and name. Billing address and avatar can be completed after the first sign-in, and a ticket purchase in ticket 13 requires the billing address to be present.
3. Username rules: unique, stable enough to show at the door, rejected when taken. Unit-test the validator. Do not use the public event id as a username.
4. Avatar upload stores an image reference on the profile. The bytes are not committed to git and not placed in `public/data`.
5. The web app uses the shared profile schema. It does not invent fields.
6. Sign-out works in the web app, including a phone browser. A disabled profile cannot start a purchase or scan. Do not put party, merch, or scanner controls on the registration screen.
7. Do not add the payment company's SDK. The payment-method list can be empty.
8. Do not put profiles, emails, or avatars into `public/data`.

## Rules

- The profile uses the shared schema. Registration sets `user`, unless the Cognito sub is `INITIAL_ADMIN_SUB`.
- The store is `data/operational/profiles.json`. It is not an HTTP route and it is not in `public/data`.
- A password is checked only to refuse a weak one, then dropped. It is not written.
- Google and Apple buttons do not accept a subject from the browser. They report that Cognito is not configured.
- Billing can be saved later, with a country. Payment methods stay empty. No payment SDK.
- Avatar bytes, when a signed-in session exists, go under `data/operational/avatars/`, which is gitignored.

## Acceptance criteria

- A new user can register with email and password, and can sign in with Google, and can sign in with Apple, in the web app on a phone browser and on desktop.
- The stored profile matches the schema: username, name, avatar reference, billing address, empty payment methods.
- Two providers with the same verified email do not create two profiles.
- The one-pager still has no account screen.
- Email, Google, and Apple are on the registration and sign-in screens, in English and Portuguese, at phone width and at desktop width. A valid form and both provider buttons stop at “Cognito is not configured”. They do not create a profile.
- The profile rules match the shared schema. A verified email keeps one `sub`. A missing username, a missing name, a billing address without a country, and a card number fail in tests. Payment methods stay empty.
- Upcoming events still open without a login.

## Tests

Unit tests on the shared schema and the API validator:

- Missing username, missing name, or a billing address without country fails.
- A profile with a raw card number field is rejected.
- Username uniqueness is a pure check against a list of existing usernames.
- Email match merges provider subjects onto one `sub` mapping rather than cloning the profile.

`pnpm --filter tropical-nomads-shared test` covers the username, the provider merge, and a disabled account. `pnpm --filter tropical-nomads-api test` covers the empty file and the refused password and card number. `pnpm --filter tropical-nomads-web test` covers the registration checks. The one-pager `pnpm lint` and `pnpm build` still pass. Cognito itself is checked by a sign-in in the web app, recorded by the implementer.

## Not done

The Cognito user pool, the web app client, and the Google and Apple providers were not created. A sign-in against Cognito was not recorded. Avatar bytes are not uploaded from the screen. The key, when a later session exists, has to stay under `data/operational/avatars/`.
