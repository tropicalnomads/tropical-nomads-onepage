import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/events-site/gallery",
        destination: "/events-site/past",
        permanent: true,
      },
      {
        source: "/events-site/gallery/:slug",
        destination: "/events-site/past/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
