import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  poweredByHeader: false,
  transpilePackages: ['tropical-nomads-shared'],
};

export default nextConfig;
