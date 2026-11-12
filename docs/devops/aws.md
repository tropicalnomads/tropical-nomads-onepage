# AWS sizes

Dated 8 November 2026. The owner asked for this record. DevOps owns later changes to the numbers. This file does not create an account, a resource, or a secret.

The audience is about five admins and parties of about 100–200 people. One copy of the API and one small database cover that. Signed-in people stay admin, door, or user. DevOps is not a product role.

Every resource below is in Frankfurt (`eu-central-1`). The VPC, Cognito pool, Amplify web app, ECR repository, ECS service, HTTP API, private assets bucket, and `tropical-nomads-frankfurt` database are running. The one-pager still does not read PostgreSQL. JSON remains the store for the one-pager and for unit tests.

Passwords stay in Amazon Cognito. The database password, when a database exists, stays in AWS Secrets Manager. This file has no password, no account id, and no card number.

## Sizes

| Element | Count | Size |
| --- | --- | --- |
| Amazon Cognito user pool | 1 | No instance class. One web app client. No quota increase. |
| Amplify app for the one-pager | The app that already exists | No new size. It keeps deploying www. |
| Amplify app for the web app | 1 | No instance class. A separate app from the one-pager. `dev.tropical-nomads.com` is its dev branch. |
| Amazon ECR repository | 1 | Keep the last 10 images. |
| Amazon ECS cluster | 1 | Fargate. |
| ECS service | 1 | Desired count 1. One task. |
| Fargate task | 1 | Linux, 0.5 vCPU, 1 GB memory. One public address, used for outbound calls only. |
| HTTP API | 1 | `api.tropical-nomads.com`. Forwards to the task on port 8787 through a VPC link. |
| Amazon RDS for PostgreSQL | 1 | `tropical-nomads-frankfurt`. `db.t4g.small`: 2 vCPU, 2 GiB memory. 20 GiB gp3, allowed to grow to 100 GiB. Backup retention 7 days. Private. Single-AZ. |
| Amazon VPC | 1 | `10.0.0.0/16`. |
| Public subnets | 2 | `10.0.0.0/24` and `10.0.1.0/24`. |
| Private subnets | 2 | `10.0.10.0/24` and `10.0.11.0/24`. The database only. |
| CloudWatch log group | 1, for the API | Keep logs for 30 days. |
| Secrets Manager secret | 2 | The RDS-managed database credential, and `tropical-nomads/api/session`. No value is written here. |
| Amazon S3 bucket | 1 | Private assets bucket. The name is `tropical-nomads-assets-` plus the account id, which is not written here. Shop photos use the prefix `shop/`. |
| Certificate | 1 | DNS-validated certificate for `api.tropical-nomads.com`, on the HTTP API. |

PostgreSQL 16.15 is the version in the Frankfurt template. The API container port is `8787`. The HTTP API forwards `api.tropical-nomads.com` to that port. www is not attached.

## Templates

The files in `infra/frankfurt` are one CloudFormation template per resource, at the sizes above. `deploy.sh` applies them in `eu-central-1` and stops if the caller is not the tropical-nomads user in `EXPECTED_AWS_ACCOUNT`. The database password is created by RDS in Secrets Manager. No password, connection string, or account id is in the files.

The templates are applied in `eu-central-1`. Google and Apple are not in the user pool template. www stays on the one-pager, and the one-pager does not read PostgreSQL.

## What each piece is for

Cognito is the login. Google and Apple are later, in ticket 10. They are not created here.

The one-pager stays on its current Amplify publish path. The web app's Amplify app serves `dev.tropical-nomads.com` and calls the API. It does not hold the database password.

The API image lives in one ECR repository. ECS runs one Fargate task at 0.5 vCPU and 1 GB. That pair is a valid Fargate size. A party of 100–200 people, and about five admins, does not need a second task.

The HTTP API is the public door to the API. The task sits in the public subnets so it can reach Cognito, the image repository, and the private assets bucket without a NAT gateway. Its public address is outbound only: port 8787 accepts the VPC link, and the database stays in the private subnets.

RDS uses private subnets in two availability zones. The database is one instance: `db.t4g.small`, 2 vCPU and 2 GiB. The disk starts at 20 GiB and may grow to 100 GiB. Backups are kept for 7 days. The instance is not publicly reachable. Aurora is not the choice. The API reads this database. The one-pager does not.

## Who can talk to what

- The HTTP API accepts HTTPS from the internet and forwards to the task through a VPC link.
- The API accepts its container port only from that VPC link.
- The database accepts 5432 only from the API.
- The task role can read the database secret, write the API log group, and read, write, and delete objects only under `shop/` in the private assets bucket. It is not an administrator role.
- The website does not receive the bucket name or an AWS key. A visitor still loads `/shop/media/<productId>`.
- Logs do not store passwords, card numbers, or object bytes.

## Not in this record

No second region. No extra database. No cache. No queue. No email service. No payment service. No second S3 bucket. No public bucket. No quota change. The one private assets bucket is the store for files, and a new kind of file gets a new prefix, not another bucket. The payment company is ticket 29 and is not named here.
