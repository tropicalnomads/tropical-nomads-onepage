# Frankfurt database

`tropical-nomads-frankfurt` is the shared PostgreSQL 16 database. The API reads and writes it when `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` are all set. Unit tests and the one-pager keep using JSON and the shop constants. The one-pager does not read PostgreSQL. www is unchanged.

## Migrations and seed

SQL lives in `database/migrations`. `database/migrate.mjs` applies those files in order and records each filename in `schema_migrations`. `database/seed.mjs` reloads the public catalog from `apps/one-pager/public/data` and upserts the two shop products and their size counts from `apps/one-pager/src/lib/shop.ts`. It does not insert a person, a password, a ticket secret, a card number, or a live payment id. Operational tables stay empty.

Both commands run inside the VPC, from a one-off task in the private subnets, with the API security group and no public IP:

`node database/migrate.mjs && node database/seed.mjs`

The API image copies `database/` and the public catalog. Do not copy `data/operational`.

## Dev site

`https://api-dev.tropical-nomads.com` is the HTTPS listener on the existing API load balancer. The task still has no public IP. The Amplify `dev` branch has `API_BASE_URL=https://api-dev.tropical-nomads.com`. It does not have `DB_PASSWORD`. `ACCOUNT_SESSION_SECRET` is the Secrets Manager secret `tropical-nomads/api/session`, and the ECS task receives the same secret. Server actions that are only in this working tree are not on the Amplify branch until that code is pushed.

## Local development

`pnpm dev:web` runs the website on `http://127.0.0.1:3100` with `API_BASE_URL=https://api-dev.tropical-nomads.com`. It does not start the API and does not open a database. Cognito lines and `ACCOUNT_SESSION_SECRET` stay in the gitignored `.env`.

`pnpm dev` runs the website and the API. The API reads a PostgreSQL 16 service on this machine. The gitignored `.env` holds:

- `API_BASE_URL=http://127.0.0.1:3101`
- `DB_HOST=127.0.0.1`
- `DB_PORT=5432`
- `DB_NAME=postgres`
- `DB_USER=tn_app`
- `DB_PASSWORD` for that local role
- `DB_SSL=false`
- `DB_STARTUP_CHECK=true`

Leave `DB_TLS_SERVERNAME` unset. The password stays in `.env`. Apply `node database/migrate.mjs` and `node database/seed.mjs` to this local database.

`database/tunnel.sh` can still open a private session to Frankfurt. The dev commands do not run it. Do not work around a missing session by making the database public.

The next change must not set `PubliclyAccessible`, add `0.0.0.0/0` on 5432, turn on Multi-AZ, or commit a password, a connection string, or an account id.
