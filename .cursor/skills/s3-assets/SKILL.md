---
name: s3-assets
description: Stores Tropical Nomads files in the one private Frankfurt assets bucket. Use when saving a file to S3, adding object storage, uploading a product image, creating a bucket or prefix, or changing who can read and write shop images.
---

# Private assets bucket

One bucket in `eu-central-1`. The template is `infra/frankfurt/s3-assets.yaml`. The name is `tropical-nomads-assets-` plus the account id from CloudFormation. Do not write the account id, an access key, or object bytes in git, docs, or logs.

The bucket is private:

- Block all public access. No public ACL and no public bucket policy.
- SSE-S3. Bucket owner enforced, so an ACL cannot make an object public.
- Deny any request that is not HTTPS.
- Versioning on. Noncurrent versions under `shop/` expire after 30 days. Unfinished uploads abort after 7 days.

## Prefixes

A prefix is one kind of file. `shop/` is product images. The object key is `shop/<productId>`. The product id is already limited to safe characters.

A new kind of file gets a new prefix and an IAM statement for that prefix. It does not get a second bucket.

## Who writes

The API is the only writer. The browser keeps using `/shop/media/<productId>`. The website does not receive AWS keys and does not talk to S3. Amplify does not receive `ASSETS_BUCKET`.

The API task role, in `infra/frankfurt/iam-api.yaml`, can `GetObject`, `PutObject`, and `DeleteObject` only on `shop/*`, and can list only that prefix. Do not grant `s3:*` on the bucket or on the role.

`infra/frankfurt/ecs-task.yaml` passes `ASSETS_BUCKET` to the task. When that variable is set, `apps/api/src/object-store.ts` stores jpeg, png, and webp bytes, at most 5 MB, at `shop/<productId>`. The product row still stores `/shop/media/<id>`, the price, and the text. Those bytes are not written to `product_image`. When the variable is absent, `product_image` remains, so unit tests and a machine without AWS still pass. A missing S3 object is not replaced by an older `product_image` row.

## Copy and deploy

`apps/api/src/copy-shop-images.ts` uploads the current shirt files and any `product_image` rows to `shop/<id>`, then points those product rows at `/shop/media/<id>`. The Postgres bytes and the disk files stay. Do not run the full database seed for this copy.

Deploy `s3-assets.yaml` on its own in `eu-central-1`. The caller is the `tropical-nomads` user and `EXPECTED_AWS_ACCOUNT` matches. Then update the API task role with the new bucket ARN. `deploy.sh` creates this stack on a full run and passes the bucket to the task. The running task keeps its current image until a new API image is built and the service is updated. The gitignored `.env` receives the bucket name for local `pnpm run dev`. No access key is committed.
