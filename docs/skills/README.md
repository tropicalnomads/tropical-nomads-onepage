# Skills

This folder holds short procedures for people working on Tropical Nomads.

- [ticket-delivery.md](ticket-delivery.md) — how an accepted build-plan ticket is delivered. The order is product manager, technical lead, developer, then QA. The developer writes implementation notes before QA. QA tests the acceptance criteria, including unit tests when they can cover the change. The owner reviews after QA. Planning docs do not start this sequence.
- [implementation-notes.md](implementation-notes.md) — what the developer writes after a ticket is implemented and before QA: one short skill for the ticket, and one skill per new tool or feature.
- [identify-stack.md](identify-stack.md) — ticket 1. Where the stack decision lives, and what the next ticket must not break.
- [repository-shape.md](repository-shape.md) — ticket 2. Where the packages live, and what the next ticket must not break.
- [deployment-change.md](deployment-change.md) — ticket 3. www publishes only the one-pager.
- [shared-client.md](shared-client.md) — ticket 4. The versioned shared package.
- [types-and-schemas.md](types-and-schemas.md) — ticket 28. Record schemas and lookups in the shared package.
- [web-app.md](web-app.md) — the web shell in `apps/web`. A phone uses it in the browser. It is not deployed.
- [languages.md](languages.md) — ticket 20. English and Portuguese in the web shell.
- [api-reads.md](api-reads.md) — ticket 06. The local API reads the published JSON. It has no public host.
- [shared-catalog.md](shared-catalog.md) — ticket 07. Every published party and artist. No agenda and no draft filter.
- [security-baseline.md](security-baseline.md) — ticket 09. The access list is admin, door, and user.
- [private-operational-data.md](private-operational-data.md) — ticket 11. Empty private JSON outside `public/`. The cross-process lock waits.
- [upcoming-events.md](upcoming-events.md) — ticket 08. The public upcoming list in the web app. Ticket links leave the app.
- [accounts-and-profile.md](accounts-and-profile.md) — ticket 10. Profile rules and sign-in screens. Cognito is not called.
- [payment-interfaces.md](payment-interfaces.md) — ticket 12. Pending traces and saved methods. No payment company.
- [hono.md](hono.md) — the REST library for `apps/api`. Hono on Node, loopback only.
- [nextjs.md](nextjs.md) — Next.js lives in the web shell. The one-pager stays on Vite.
- [turborepo.md](turborepo.md) — how package tasks run. pnpm stays the package manager.
- [aws-sizes.md](aws-sizes.md) — where the AWS sizes live, and what the next ticket must not change.
- [frankfurt-hosts.md](frankfurt-hosts.md) — the Frankfurt host templates, and what the next change must not break.
- [host-status.md](host-status.md) — the local page that reads the Frankfurt host status.
- [cloudformation.md](cloudformation.md) — one template per resource, applied from `infra/frankfurt/deploy.sh`.
- [cognito.md](cognito.md) — the web app user pool. Email sign-in. Google and Apple are not configured.
- [rds-postgresql.md](rds-postgresql.md) — the private `db.t4g.small` PostgreSQL template.
- [amplify-web.md](amplify-web.md) — the new web app's Amplify app. www stays the one-pager.
- [ecs-api.md](ecs-api.md) — the private API container on Fargate.

A file belongs here when the procedure is real. Product decisions stay in the [master plan](../master-plan.md). Package, deploy, and data structure stay in [architecture](../architecture/monorepo-and-data.md). The [documentation index](../README.md) says which folder to use. The delivery sequence is [ticket-delivery.md](ticket-delivery.md) and the notes template is [implementation-notes.md](implementation-notes.md). Those two files are the procedures that were on tag `product-plan-v1`.

The kind of note that can land here later, once the steps are true:

- refreshing the published event list, after that workflow is agreed
- publishing the one-pager
- adding a merch product, after the catalog is data rather than a constant in the page

Those are examples of future titles only. They are not procedures, and this folder does not contain them.

Placeholder skills do not belong here.
