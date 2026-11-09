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
  reactStrictMode: true,
  typedRoutes: false,
  poweredByHeader: false,
  transpilePackages: ['tropical-nomads-shared', 'tropical-nomads-api'],
};

export default nextConfig;
