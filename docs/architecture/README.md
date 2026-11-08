# Architecture

This folder is the architecture of the product. It is planning only. It does not add packages, change the one-pager, or create a host.

The [master plan](../master-plan.md) says what the product does. These pages say how the pieces and the records fit. The [build plan](../build-plan/README.md) is the order of work. Ticket 28 writes the schemas and the lookups before the feature tickets.

| Page | What it shows |
| --- | --- |
| [System](system.md) | Repositories, deploys, and who calls the API. Mermaid diagrams of the running shape. |
| [Models](models.md) | How the records point at each other, which store holds them, and the fields already named. Mermaid diagram of the model. |
| [Lookups](indexes.md) | The keys each feature reads by, which of those keys are unique, and which keys stay out. |
| [Monorepo and data](monorepo-and-data.md) | Why this repository keeps the one-pager, the API, Bookings, and the JSON, and why operational records stay out of `public/data`. |

Add a page here when it describes packages, deploys, or records. Link it from this table. Vendor names stay out until the owner has chosen them.
