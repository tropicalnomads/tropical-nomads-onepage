# Skills

This folder holds short procedures for people working on Tropical Nomads.

- [identify-stack.md](identify-stack.md) — ticket 1. Where the stack decision lives, and what the next ticket must not break.
- [repository-shape.md](repository-shape.md) — ticket 2. Where the packages live, and what the next ticket must not break.
- [deployment-change.md](deployment-change.md) — ticket 3. www publishes only the one-pager.
- [shared-client.md](shared-client.md) — ticket 4. The versioned shared package.
- [types-and-schemas.md](types-and-schemas.md) — ticket 28. Record schemas and lookups in the shared package.
- [web-app.md](web-app.md) — the web shell in `apps/web`. A phone uses it in the browser. It is not deployed.
- [languages.md](languages.md) — ticket 20. English and Portuguese in the web shell.
- [api-reads.md](api-reads.md) — ticket 06. The local API reads the published JSON. It has no public host.
- [nextjs.md](nextjs.md) — Next.js lives in the web shell. The one-pager stays on Vite.
- [turborepo.md](turborepo.md) — how package tasks run. pnpm stays the package manager.
- [aws-sizes.md](aws-sizes.md) — where the AWS sizes live, and what the next ticket must not change.

A file belongs here when the procedure is real. Product decisions stay in the [master plan](../master-plan.md). The delivery sequence and the notes template stay on tag `product-plan-v1`.

The kind of note that can land here later, once the steps are true:

- refreshing the published event list, after that workflow is agreed
- publishing the one-pager
- adding a merch product, after the catalog is data rather than a constant in the page

Those are examples of future titles only. They are not procedures, and this folder does not contain them.

Placeholder skills do not belong here.
