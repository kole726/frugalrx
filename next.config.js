/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'frugalrx.vercel.app',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Authorization, Content-Type' },
        ],
      },
    ]
  },
  // Add these to handle caching issues
  webpack: (config, { dev, isServer }) => {
    // Disable caching in development
    if (dev) {
      config.cache = false;
    }
    return config;
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  async rewrites() {
    return [
      // Rewrite for the drugautocomplete endpoint to match America's Pharmacy exactly
      {
        source: '/drugautocomplete/:query',
        destination: '/api/drugautocomplete/:query',
      },
    ];
  },
}

module.exports = nextConfig 