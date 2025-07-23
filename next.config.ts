import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
  images: {
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
