/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable React strict mode for better development experience
    reactStrictMode: true,

    // Disable x-powered-by header for security
    poweredByHeader: false,

    // Optimize images
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '',
                pathname: '/**',
            },
        ],
        formats: ['image/webp', 'image/avif'],
    },

    // Enable SWC minification for better performance
    swcMinify: true,

    // Experimental features
    experimental: {
        // Disable server components for now to fix hydration issues
        serverComponentsExternalPackages: [],
    },

    // Webpack configuration
    webpack: (config, { dev, isServer }) => {
        // Fix for client-side hydration issues
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            }
        }

        // Suppress hydration warnings in development
        if (dev) {
            config.devtool = 'eval-source-map'
        }

        return config
    },

    // Compiler options
    compiler: {
        // Remove console logs in production
        removeConsole: process.env.NODE_ENV === 'production',
    },

    // Headers for security and performance
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin'
                    }
                ]
            }
        ]
    }
}

module.exports = nextConfig