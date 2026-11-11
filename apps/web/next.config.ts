import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
const envPath = join(repoRoot, envFile);
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const nextConfig: NextConfig = {
  env: {
    API_BASE_URL: process.env.API_BASE_URL,
    COGNITO_REGION: process.env.COGNITO_REGION,
    COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
    COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
    COGNITO_HOSTED_DOMAIN: process.env.COGNITO_HOSTED_DOMAIN,
    COGNITO_REDIRECT_URI: process.env.COGNITO_REDIRECT_URI,
    COGNITO_GOOGLE: process.env.COGNITO_GOOGLE,
    COGNITO_APPLE: process.env.COGNITO_APPLE,
  },
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '16mb',
    },
  },
  typedRoutes: false,
  poweredByHeader: false,
  transpilePackages: ['tropical-nomads-shared', 'tropical-nomads-api'],
  outputFileTracingRoot: repoRoot,
  outputFileTracingIncludes: {
    '/*': [
      '../one-pager/public/data/*.json',
      '../one-pager/public/events/banners/*.{jpeg,jpg,png,webp}',
      '../one-pager/public/partners/*.{jpeg,jpg,png,webp}',
      '../one-pager/public/shop/*.{jpeg,jpg,png,webp}',
    ],
  },
};

export default nextConfig;
