# System

**Status:** planning only. The hosts below are the decided targets. The Amplify app for the web app, the ECS service, and RDS are not created by these notes.

## How the product is wired

People use three fronts. The one-pager stays the public site. The web app is the product, including on a phone. Bookings is the admin calendar and the later integrations tab. All three meet at the API. The shared repository is the contract the clients and the API share. It is not a second database.

```mermaid
flowchart TB
  visitor[Visitor]
  buyer[Buyer and user]
  doorStaff[Door staff]
  admin[Admin]

  onepager[One-pager at www]
  webapp[Web app]
  bookings[Bookings]
  shared[Shared repo: theme, types, schemas]
  api[API]
  cognito[Amazon Cognito]
  publicJson[Published JSON]
  privateJson[Private JSON]

  visitor --> onepager
  buyer --> webapp
  doorStaff --> webapp
  admin --> bookings
  admin --> webapp

  onepager --> publicJson
  webapp --> shared
  webapp --> api
  bookings --> api
  api --> shared
  api --> cognito
  api --> publicJson
  api --> privateJson
```

The one-pager reads the published files it already ships. It does not write tickets. The web app and Bookings write through the API. Cognito is the sign-in for the web app, with Google and Apple. Passwords stay in Cognito.

iOS and Android repositories are optional and last. If they are created, they call this API. They are not on this diagram because this plan does not give them screens.

## Deploys

```mermaid
flowchart LR
  subgraph monorepo [tropical-nomads-onepage]
    pagePkg[One-pager package]
    apiPkg[API package]
    bookingsPkg[Bookings package]
    jsonFiles[JSON files]
  end

  subgraph clients [Separate repositories]
    sharedRepo[Shared repo]
    webRepo[Web app repo]
  end

  www[www on its current Amplify app]
  webHost[Web app on a later Amplify app]
  apiHost[API on a later ECS container]
  bookingsHost[bookings.tropical-nomads.com]

  pagePkg --> www
  webRepo --> webHost
  apiPkg --> apiHost
  bookingsPkg --> bookingsHost
  webRepo --> sharedRepo
  apiPkg --> jsonFiles
  pagePkg --> jsonFiles
```

`www.tropical-nomads.com` keeps the one-pager's existing Amplify app. The web app is a different Amplify app and is not live yet. The API is a Docker container on ECS and is not live yet. Bookings keeps its own address. `timetable.tropical-nomads.com` stays outside this diagram.

Amazon RDS for PostgreSQL is the database recommendation to confirm. Until that confirmation, the API's store is the JSON files. The recommendation does not move them.

## A ticket purchase, once the feature tickets exist

```mermaid
sequenceDiagram
  actor Buyer
  participant Web as Web app
  participant API
  participant Store as Private JSON
  Buyer->>Web: Choose a ticket on a published party
  Web->>API: startPayment purpose tickets
  API->>Store: Order and trace pending_provider
  API->>Store: Issued ticket, not valid for entry
  API-->>Web: Ticket id and secret for the QR
  Note over Web,Store: Confirmation waits on a provider that is not chosen
```

Check-in is a later call. Door staff scan the QR. The API reads the issued ticket and the trace, then writes a check-in. The web app does not declare the scan a success by itself.

## Security on this shape

- A visitor can read the published JSON. That read does not include profiles, traces, ticket secrets, invites, or stock counts.
- Admin writes parties, ticket offers, and shop through the API. Door writes a check-in for an invited party. A user reads their own orders and tickets.
- The shared repo holds shapes. The private JSON holds the secret values. Publishing the shared package does not publish a buyer's QR secret.
