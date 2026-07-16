import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is the default in Next.js 16 — fast builds, no webpack needed
  turbopack: {},

  // Allow Cesium.js to be fetched from /public/cesium/ (no special headers needed)
  experimental: {},
};

export default nextConfig;
