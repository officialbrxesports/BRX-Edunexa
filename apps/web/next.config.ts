import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://brx-edunexa-api.onrender.com/:path*",
      },
    ];
  },
};

export default nextConfig;