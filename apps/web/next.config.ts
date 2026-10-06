import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  reactCompiler: true,

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: isDevelopment
          ? "http://localhost:3000/:path*"
          : "https://brx-edunexa-api.onrender.com/:path*",
      },
    ];
  },
};

export default nextConfig;