import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@godigitify/types', '@godigitify/utils', '@godigitify/api-client'],
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3001'] },
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }],
  },
};

export default nextConfig;
