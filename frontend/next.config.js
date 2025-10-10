/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  // Don't put env here - it's handled by Cloud Run --set-env-vars
}

module.exports = nextConfig
