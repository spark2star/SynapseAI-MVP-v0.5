/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  
  // ✅ Required for Docker deployment
  output: 'standalone',
  
  // ✅ Build-time env vars
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://synapseai-backend-910625707162.asia-south1.run.app/api/v1'
  },
  
  experimental: {
    serverActions: true
  },

  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  }
}

module.exports = nextConfig
