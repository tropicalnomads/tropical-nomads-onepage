# 10 — Accounts and profile

**Status:** not started. Cognito, Google, Apple, and the user record. No payment provider.

## Outcome

A person can register and sign in on the web app, including in a phone browser, with an email and password, with Google, or with Apple. The API stores a profile for that Cognito user: name, username, avatar, billing address, and payment-method slots. Passwords and raw card numbers are not in our JSON. Native app clients are not created in this ticket.

## Why it exists

Tickets, merch, and door invites need a real user. The current site has no accounts. Language choice is only `tn:language:v1` in the browser. The owner asked for Cognito plus Google and Apple, and for a profile rich enough to pay for tickets and merch later.

## Depends on

- [04 — Shared client repo](04-shared-client-repo.md). The profile schema lives there.
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

## Acceptance criteria

- A new user can register with email and password, and can sign in with Google, and can sign in with Apple, in the web app on a phone browser and on desktop.
- The stored profile matches the schema: username, name, avatar reference, billing address, empty payment methods.
- Two providers with the same verified email do not create two profiles.
- The one-pager still has no account screen.

## Tests

Unit tests on the shared schema and the API validator:

- Missing username, missing name, or a billing address without country fails.
- A profile with a raw card number field is rejected.
- Username uniqueness is a pure check against a list of existing usernames.
- Email match merges provider subjects onto one `sub` mapping rather than cloning the profile.

The implementer runs those tests. Cognito itself is checked by a sign-in in the web app, recorded by the implementer. `pnpm lint` and `pnpm build` in the one-pager still pass.
