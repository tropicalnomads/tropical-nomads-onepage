# RDS PostgreSQL

The template `infra/frankfurt/rds-postgres.yaml` describes `tropical-nomads-frankfurt`: PostgreSQL 16.15, `db.t4g.small`, one instance in `eu-central-1a`, 20 GiB gp3 that may grow to 100 GiB, backups kept for 7 days. It is not publicly reachable. Port 5432 accepts the API security group only. TLS is required. The master user is `tn_app`. RDS stores the password in Secrets Manager.

JSON remains the store. The API does not read this instance yet.

The next change must not set `PubliclyAccessible` to true, add `0.0.0.0/0` on 5432, turn on Multi-AZ, or commit a connection string.
