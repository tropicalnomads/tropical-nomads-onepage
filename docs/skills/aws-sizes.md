# AWS sizes

The owner asked for this skill and for the size record. DevOps owns later changes to the numbers.

Read [docs/devops/aws.md](../devops/aws.md) before any host ticket. The sizes for Frankfurt (`eu-central-1`) are there: one Fargate task at 0.25 vCPU and 0.5 GB, and one `db.t4g.micro` database at 2 vCPU, 1 GiB, and 20 GiB gp3. The host templates in `infra/frankfurt` use those sizes.

The next ticket must not change a size, add a region, put a secret in the repo, open the database to the internet, or add a fourth product role. The API reads PostgreSQL when its database settings exist. JSON remains the one-pager and unit-test store.
