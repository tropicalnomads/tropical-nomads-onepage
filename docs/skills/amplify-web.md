# Amplify web app

`tropical-nomads-web` is the new web app's Amplify app. It is not the one-pager and the template attaches no production domain. The repository is not connected, because no owner GitHub token was available. The build spec pins Node 24.22.2 and pnpm 12.18.0, installs from the repo root, and runs `pnpm --filter tropical-nomads-web build`.

The dev branch serves `dev.tropical-nomads.com`. Its `API_BASE_URL` is `https://api-dev.tropical-nomads.com`. The database password is not an Amplify variable. `amplify.yml` still publishes the one-pager from `apps/one-pager/dist` and the web app from `apps/web`. Do not attach www.

The template is `infra/frankfurt/amplify-web-app.yaml`.
