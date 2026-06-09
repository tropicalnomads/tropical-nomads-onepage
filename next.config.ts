import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/gallery",
        destination: "/ultimas-edicoes",
        permanent: true,
      },
      {
        source: "/gallery/:editionId",
        destination: "/ultimas-edicoes/:editionId",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
