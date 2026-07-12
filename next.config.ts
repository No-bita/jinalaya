import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow local uploaded images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'unpkg.com',
      },
      {
        protocol: 'https',
        hostname: '**', // Allow S3/R2 domains
      },
    ],
  },
  // Handle body size for uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  // Turbopack configuration (Next.js 16 default bundler)
  turbopack: {},
  // Server-side external packages (native modules)
  serverExternalPackages: ['sharp'],
};

export default nextConfig;
