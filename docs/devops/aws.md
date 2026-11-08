# AWS sizes

Dated 8 November 2026. The owner asked for this record. DevOps owns later changes to the numbers. This file does not create an account, a resource, or a secret.

The audience is about five admins and parties of about 100–200 people. One copy of the API and one small database cover that. Signed-in people stay admin, door, or user. DevOps is not a product role.

Every resource below is in Frankfurt (`eu-central-1`). None of them exist yet, except the one-pager's current Amplify app. JSON stays the store until the owner confirms Amazon RDS for PostgreSQL.

Passwords stay in Amazon Cognito. The database password, when a database exists, stays in AWS Secrets Manager. This file has no password, no account id, and no card number.

## Sizes

| Element | Count | Size |
| --- | --- | --- |
| Amazon Cognito user pool | 1 | No instance class. One web app client. No quota increase. |
| Amplify app for the one-pager | The app that already exists | No new size. It keeps deploying www. |
| Amplify app for the web app | 1, not launched | No instance class. A separate app from the one-pager. |
| Amazon ECR repository | 1 | Keep the last 10 images. |
| Amazon ECS cluster | 1, not created | Fargate. |
| ECS service | 1 | Desired count 1. One task. |
| Fargate task | 1 | Linux, 0.5 vCPU, 1 GB memory. |
| Application load balancer | 1 | No instance class. Listens on 443. |
| Amazon RDS for PostgreSQL | 1, not created | `db.t4g.small`: 2 vCPU, 2 GiB memory. 20 GiB gp3, allowed to grow to 100 GiB. Backup retention 7 days. |
| Amazon VPC | 1 | `10.0.0.0/16`. |
| Public subnets | 2 | `10.0.0.0/24` and `10.0.1.0/24`. |
| Private subnets | 2 | `10.0.10.0/24` and `10.0.11.0/24`. |
| NAT gateway | 1 | One gateway, in one public subnet. |
| CloudWatch log group | 1, for the API | Keep logs for 30 days. |
| Secrets Manager secret | 1, when the database is confirmed | The database credential only. No value is written here. |
| Certificate | 1, when the API hostname exists | In Frankfurt, on the load balancer. The hostname is not chosen here. |

PostgreSQL 16.15 is the version in the Frankfurt template. The API container port is `8787`. The load balancer is meant to forward 443 to that port. Its certificate waits until a hostname is chosen, so the template has no listener.

## Templates

The files in `infra/frankfurt` are one CloudFormation template per resource, at the sizes above. `deploy.sh` applies them in `eu-central-1` and stops if the caller is not the tropical-nomads user in `EXPECTED_AWS_ACCOUNT`. The database password is created by RDS in Secrets Manager. No password, connection string, or account id is in the files.

Applying the VPC needs permission to allocate and release an address and to delete a NAT gateway. Until those actions are allowed, the templates are not applied. JSON stays the store. Google and Apple are not in the user pool template. www stays on the one-pager.

## What each piece is for

Cognito is the login. Google and Apple are later, in ticket 10. They are not created here.

The one-pager stays on its current Amplify app. The new web app gets its own Amplify app, and that app is not launched.

The API image lives in one ECR repository. ECS runs one Fargate task at 0.5 vCPU and 1 GB. That pair is a valid Fargate size. A party of 100–200 people, and about five admins, does not need a second task.

The load balancer is the only public door to the API. The task and the database sit in the private subnets. One NAT gateway lets the private task reach Cognito and the image repository.

RDS asks for private subnets in two availability zones before it will create a database. The database is still one instance: `db.t4g.small`, 2 vCPU and 2 GiB. The disk starts at 20 GiB, the smallest gp3 size this record uses, and may grow to 100 GiB. Backups are kept for 7 days. The instance is not publicly reachable. Aurora is not the choice. JSON stays the store until the owner confirms this database, and this file does not migrate anything.

## Who can talk to what

- The load balancer accepts 443 from the internet.
- The API accepts its container port only from the load balancer.
- The database accepts 5432 only from the API.
- The task role can read the database secret and write the API log group. It is not an administrator role.
- Logs do not store passwords or card numbers.

## Not in this record

No second region. No extra database. No cache. No queue. No email service. No payment service. No new S3 bucket. No quota change. The payment company is ticket 29 and is not named here.
