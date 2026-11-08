# AWS sizes

The owner asked for this skill and for the size record. DevOps owns later changes to the numbers.

Read [docs/devops/aws.md](../devops/aws.md) before any host ticket. The sizes for Frankfurt (`eu-central-1`) are there: one Fargate task at 0.5 vCPU and 1 GB, and one `db.t4g.small` database at 2 vCPU, 2 GiB, and 20 GiB gp3. Nothing in that file is created by reading it.

The next ticket must not connect to AWS, create those resources, change a size, add a region, put a secret in the repo, or add a fourth product role. JSON stays the store until the owner confirms the database.
