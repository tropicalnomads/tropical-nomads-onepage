# Frankfurt database

`tropical-nomads-frankfurt` is the shared PostgreSQL 16 database. The API reads and writes it when `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` are all set. Unit tests and the one-pager keep using JSON and the shop constants. The one-pager does not read PostgreSQL. www is unchanged.

## Migrations and seed

SQL lives in `database/migrations`. `database/migrate.mjs` applies those files in order and records each filename in `schema_migrations`. `database/seed.mjs` reloads the public catalog from `apps/one-pager/public/data` and upserts the two shop products and their size counts from `apps/one-pager/src/lib/shop.ts`. It does not insert a person, a password, a ticket secret, a card number, or a live payment id. Operational tables stay empty.

Both commands run inside the VPC, from a one-off task in the private subnets, with the API security group and no public IP:

`node database/migrate.mjs && node database/seed.mjs`

The API image copies `database/` and the public catalog. Do not copy `data/operational`.

## Dev site

`https://api-dev.tropical-nomads.com` is the HTTPS listener on the existing API load balancer. The task still has no public IP. The Amplify `dev` branch has `API_BASE_URL=https://api-dev.tropical-nomads.com`. It does not have `DB_PASSWORD`. `ACCOUNT_SESSION_SECRET` is the Secrets Manager secret `tropical-nomads/api/session`, and the ECS task receives the same secret. Server actions that are only in this working tree are not on the Amplify branch until that code is pushed.

## Local keys

`database/tunnel.sh` reads the current RDS secret, does not print it, and rewrites only the database lines in the gitignored `.env`:

- `DB_HOST=127.0.0.1`
- `DB_PORT=5432`
- `DB_NAME=postgres`
- `DB_USER=tn_app`
- `DB_PASSWORD` from the current secret
- `DB_TLS_SERVERNAME` is the RDS hostname, because the certificate is not valid for `127.0.0.1`
- `DB_STARTUP_CHECK=true`

Cognito lines and `ACCOUNT_SESSION_SECRET` stay as they are. Leave `API_BASE_URL` on `http://127.0.0.1:3101`.

The EC2 tunnel template is `infra/frankfurt/db-bastion.yaml`. It has no public IP and no SSH. This account cannot create or read an instance profile, so that host is not running. The script instead starts a private Fargate task in the API security group and forwards port 5432 with SSM. Opening the session needs `ssm:StartSession` on that task. This user does not have that permission, so the port does not open yet. Do not work around it by making the database public.

The next change must not set `PubliclyAccessible`, add `0.0.0.0/0` on 5432, turn on Multi-AZ, or commit a password, a connection string, or an account id.
