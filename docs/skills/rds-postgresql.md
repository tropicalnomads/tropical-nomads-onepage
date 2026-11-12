# RDS PostgreSQL

The template `infra/frankfurt/rds-postgres.yaml` describes `tropical-nomads-frankfurt`: PostgreSQL 16.15, `db.t4g.micro`, one instance in `eu-central-1a`, 20 GiB gp3 that may grow to 100 GiB, backups kept for 7 days. It is not publicly reachable. Port 5432 accepts the API security group only. TLS is required. The master user is `tn_app`. RDS stores the password in Secrets Manager.

The API reads this instance when its database settings are present. JSON remains the store for unit tests and the one-pager. The seed, the migration runner, and the local tunnel are in [frankfurt-database.md](frankfurt-database.md).

The next change must not set `PubliclyAccessible` to true, add `0.0.0.0/0` on 5432, turn on Multi-AZ, or commit a connection string.
