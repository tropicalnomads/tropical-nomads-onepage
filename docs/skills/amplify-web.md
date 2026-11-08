# Amplify web app

`tropical-nomads-web` is the new web app's Amplify app. It is not the one-pager and the template attaches no production domain. The repository is not connected, because no owner GitHub token was available. The build spec installs pnpm 9.15.9 from the repo root and runs `pnpm --filter tropical-nomads-web build`.

The deploy passes the Cognito pool id and app client id into this app's environment. `API_BASE_URL` is not set, because the load balancer hostname does not answer. `amplify.yml` still publishes only `apps/one-pager/dist`. Do not add this app to that file and do not attach www.

The template is `infra/frankfurt/amplify-web-app.yaml`.
