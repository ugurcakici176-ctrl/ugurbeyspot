import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.ugurbeyspot.com",
          },
        ],
        destination: "https://ugurbeyspot.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
