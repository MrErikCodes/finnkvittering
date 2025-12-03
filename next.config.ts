import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Puppeteer krever noen ganger ekstra konfigurasjon
  serverExternalPackages: ['puppeteer-core'],
};

export default nextConfig;
