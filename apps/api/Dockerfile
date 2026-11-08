# API image only. The one-pager build and operational JSON are not copied.
FROM node:22-bookworm-slim

ADD https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem /etc/ssl/rds-global-bundle.pem
RUN chmod 644 /etc/ssl/rds-global-bundle.pem

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/bookings/package.json apps/bookings/package.json
COPY apps/one-pager/package.json apps/one-pager/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile --filter tropical-nomads-api...

COPY apps/api apps/api
COPY packages/shared packages/shared
COPY apps/one-pager/public/data apps/one-pager/public/data

USER node
ENV API_PORT=8787
ENV API_HOSTNAME=127.0.0.1
EXPOSE 8787

CMD ["node", "--experimental-strip-types", "apps/api/src/main.ts"]
