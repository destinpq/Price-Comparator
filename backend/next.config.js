/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Skip database initialization during build
    SKIP_DB_INIT: process.env.NODE_ENV === 'production' ? 'true' : process.env.SKIP_DB_INIT || 'false',
  },
  // Other Next.js config options
};

module.exports = nextConfig; 