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
  // Add these to handle caching issues
  webpack: (config, { dev, isServer }) => {
    // Disable caching in development
    if (dev) {
      config.cache = false;
    }
    return config;
  },
}

module.exports = nextConfig 