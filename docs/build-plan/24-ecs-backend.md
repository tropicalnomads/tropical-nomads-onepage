# 24 — API container on ECS

**Status:** not started. Not live yet. Does not publish a public production API.

## Outcome

The API is packaged as a Docker container and that container is the process ECS would run. There is no public production URL for it. The one-pager deploy is unchanged. This ticket does not make the API live.

## Why it exists

The owner named a Docker container on ECS as the backend host. The API has to have that shape before the new app can go live. Building the container is not the same as opening it to the public. The one-pager stays a static Amplify site and does not start routing through this container.

## Depends on

- [06 — API reads published data](06-api-reads-published-data.md).
- [23 — Web app on Amplify](23-amplify-frontend.md). The frontend host is named first. This ticket does not wait on a public launch.

## To-do

1. Add a Dockerfile for the API package only. Do not put the one-pager build in that image.
2. Describe the ECS service that runs that image. Do not give it a public production hostname.
3. Do not point www at the container, and do not change `amplify.yml`.
4. Do not create the RDS instance and do not move JSON into a database.
5. Do not put AWS credentials, account ids, or secrets in the repo.
6. Do not deploy Bookings from this container.

## Acceptance criteria

- The API image does not contain the one-pager `dist/`.
- No public production URL was created for the API.
- www still deploys from the one-pager Amplify app.

## Tests

No unit test for ECS. The implementer runs the one-pager `pnpm lint` and `pnpm build`. They check the image build context does not include `public/data` secrets and that `amplify.yml` is unchanged.
