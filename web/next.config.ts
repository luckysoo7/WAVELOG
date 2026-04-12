import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/date/:date",
        destination: "/bcamp/:date",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
