import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Runs as a Node.js server (`npm start`) so /api/order works. Pages are still generated at build time.
  trailingSlash: true,
  // Images are pre-optimised to WebP by scripts/optimize-images.mjs.
  images: { unoptimized: true },
  // Needed because the site has two root layouts ("/" redirect and [locale]).
  experimental: { globalNotFound: true },
};

export default nextConfig;
