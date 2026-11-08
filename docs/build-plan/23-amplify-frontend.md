# 23 — Web app on Amplify

**Status:** not started. Not live yet. Does not replace the one-pager.

## Outcome

The new web app has its own Amplify app and can build from the web app repository. That app is not [www.tropical-nomads.com](https://www.tropical-nomads.com). The one-pager keeps the Amplify app it already has. Nothing in this ticket makes the new app public.

## Why it exists

The owner named Amplify as the frontend host. That host has to exist before the new app can go live, and this ticket is not the go-live. `amplify.yml` in this repo already builds the one-pager into `dist/`. A second app is how the web app gets a host without taking www.

## Depends on

- [05 — Web app repository](05-app-repos.md).
- [03 — Deployment change](03-deployment-change.md). www stays on the existing Amplify app.

## To-do

1. Give the web app repository its own Amplify app. Do not add the web app to the one-pager's Amplify app.
2. Leave `amplify.yml`, the cache headers, and `AWS_COMMIT_ID` on the one-pager as they are.
3. Do not attach a production domain, and do not point www at the new app.
4. Do not create the ECS service or the database here.
5. Do not put AWS credentials in the repo.
6. Do not deploy the iOS or Android repos. They are not part of this host.

## Acceptance criteria

- The one-pager still deploys from its existing Amplify app to www.
- The web app's Amplify app is a different app and has no production domain.
- www still serves the one-pager.

## Tests

No unit test for Amplify. The implementer runs the one-pager `pnpm lint` and `pnpm build` and checks `amplify.yml` is unchanged. They record that www was not retargeted.
