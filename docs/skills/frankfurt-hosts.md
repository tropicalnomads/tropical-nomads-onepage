# Frankfurt hosts

The new app's hosts are templates in `infra/frankfurt`. One CloudFormation file per resource. `deploy.sh` applies that directory in `eu-central-1`. Set `EXPECTED_AWS_ACCOUNT` to the account that may change. The script stops if the caller is a different account or is not the user `tropical-nomads`.

The names are the VPC `tropical-nomads`, the database `tropical-nomads-frankfurt`, the user pool and Amplify app `tropical-nomads-web`, and the API cluster, service, image repository, and load balancer `tropical-nomads-api`. JSON stays the store. `amplify.yml` is unchanged. www is not retargeted.

Run `node --experimental-strip-types --test infra/frankfurt/test/templates.test.ts` and `pnpm --filter tropical-nomads-api test`.

Check the live hosts with the local status page in [host-status.md](host-status.md). The API task is healthy. `API_BASE_URL` stays unset because the load balancer has no listener and its hostname does not answer. The next change must not open port 5432 to the internet, put a password in git, attach www to the new Amplify app, or add Google or Apple without the owner's client ids.

## Decisions

The owner asked for one `db.t4g.small` in Frankfurt, single-AZ, and for JSON to stay the store.

The owner asked for a separate repository named `tropical-nomads-aws`.

- Problem: That remote could not be created from this environment, and the hosts have to be reviewed in this pull request.
- Options: Leave the files only in the uncreated remote, or commit one file per resource here and deploy that commit.
- Why: The files have to be versioned and applied from a commit this pull request reviews.

- Problem: The size record leaves the PostgreSQL version until the instance exists.
- Options: PostgreSQL 16.15, or a newer major that Frankfurt offers on `db.t4g.small`.
- Why: 16.15 is the newest PostgreSQL 16 for this class on gp3.

- Problem: The pool has to exist for email sign-in, and Google and Apple need owner client ids that are not in the repo.
- Options: Invent the providers, or create the pool and the web client and leave the providers off.
- Why: There is no client id to configure. Email is the username.

- Problem: The load balancer is meant to listen on 443, and the certificate waits for a hostname that is not chosen.
- Options: Open HTTP to the internet, invent a hostname, or create the load balancer without a listener.
- Why: A certificate needs a hostname the owner controls. The API gets no public production URL.

- Problem: A later listener reaches the task on the task network address. Loopback never sees that traffic.
- Options: Bind every run to `0.0.0.0`, or keep loopback as the default and set `API_HOSTNAME` only on the ECS task.
- Why: Local runs stay on `127.0.0.1`. The security group is what admits the load balancer.

- Problem: The NAT gateway needs an address, and this user cannot allocate or release one, or delete the gateway.
- Options: Put the task on a public address, or keep the private subnets and wait for those actions.
- Why: The database and the task stay private.
