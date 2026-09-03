import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: import.meta.dirname,
  images: {
    formats: ['image/webp'],
  },
  typedRoutes: true,
};

export default nextConfig;
