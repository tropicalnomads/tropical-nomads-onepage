# CloudFormation

Frankfurt infrastructure is one template per resource under `infra/frankfurt`. `deploy.sh` deploys those files in order with the AWS CLI in `eu-central-1`. Set `EXPECTED_AWS_ACCOUNT` before running it. The script stops when the caller is a different account or is not the user `tropical-nomads`.

No template contains a password, a provider secret, a connection string, or an account id. RDS creates the database password in Secrets Manager.

Check the templates with `node --experimental-strip-types --test infra/frankfurt/test/templates.test.ts` before a deploy. The next change must not add a second region, a public database, or a secret to these files.
