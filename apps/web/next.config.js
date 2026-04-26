// FILE: apps/web/next.config.js
// PURPOSE: Next.js 14 config with proper API proxy
// DEPENDS ON: next
// LAST UPDATED: F31 Fix - Body passthrough

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },

  async rewrites() {
    const backendUrl =
      process.env.BACKEND_URL ?? "http://localhost:5000";

    return {
      beforeFiles: [
        {
          source: "/api/v1/:path*",
          destination: `${backendUrl}/api/v1/:path*`,
        },
      ],
    };
  },

  // Ensure body size limit is adequate
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

module.exports = nextConfig;