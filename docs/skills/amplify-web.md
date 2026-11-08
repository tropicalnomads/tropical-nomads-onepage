# Amplify web app

`tropical-nomads-web` is the new web app's Amplify app. It is not the one-pager and the template attaches no production domain. The repository is not connected, because no owner GitHub token was available. The build spec installs pnpm 9.15.9 from the repo root and runs `pnpm --filter tropical-nomads-web build`.

`amplify.yml` still publishes only `apps/one-pager/dist`. Do not add this app to that file and do not attach www.

The template is `infra/frankfurt/amplify-web-app.yaml`.
