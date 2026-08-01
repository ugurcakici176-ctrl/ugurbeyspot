import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL("https://firebasestorage.googleapis.com/v0/b/ugurbeyspot-51329*/**"),
      new URL("https://ugurbeyspot-51329.firebasestorage.app/**"),
    ],
  },
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
