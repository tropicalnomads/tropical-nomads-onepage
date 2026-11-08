import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  poweredByHeader: false,
  transpilePackages: ['tropical-nomads-shared', 'tropical-nomads-api'],
};

export default nextConfig;
