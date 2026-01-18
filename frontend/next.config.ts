/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // Important for Docker
  env: {
    BACKEND_URL: process.env.BACKEND_URL,
  },
};

module.exports = nextConfig;
