# ECS API

The API image is built from `apps/api/Dockerfile`. The build context excludes `data/`, so operational JSON stays out, and the image does not copy the one-pager `dist/`. The image default bind is `127.0.0.1`. The task sets `API_HOSTNAME=0.0.0.0` and `API_PORT=8787`.

The cluster is `tropical-nomads`. The service is `tropical-nomads-api`: one Fargate task at 0.5 vCPU and 1 GB, private subnets, no public IP. The repository `tropical-nomads-api` keeps the last 10 images. Logs are `/tropical-nomads/api` for 30 days. The load balancer `tropical-nomads-api` has no listener and no production hostname.

The task role and the execution role can read the database secret. The container receives `DB_USER` and `DB_PASSWORD` from that secret, and `DB_HOST`, `DB_PORT`, and `DB_NAME` from the task environment. The password is not in git. JSON remains the catalog. There is no public API URL: the load balancer has no listener.

From the repo root, `docker build -f apps/api/Dockerfile -t tropical-nomads-api .` builds the image. The next change must not give the task a public IP, add a public listener before a hostname exists, or copy `data/operational` into the image.
