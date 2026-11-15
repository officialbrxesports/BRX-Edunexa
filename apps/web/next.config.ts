import type { NextConfig } from 'next';

// In production the browser talks to "/backend/..." on the SAME domain as the
// website, and Next forwards it to the API. This keeps the login cookie
// first-party (works in every browser) without paying for a custom domain.
// Set NEXT_PUBLIC_API_URL=/backend and API_BASE_URL=<your API URL> there.
const apiBaseUrl = (process.env.API_BASE_URL ?? '').replace(/\/+$/, '');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    if (!apiBaseUrl) return [];

    return [
      {
        source: '/backend/:path*',
        destination: `${apiBaseUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
