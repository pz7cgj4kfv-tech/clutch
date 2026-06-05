import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  generateBuildId: async () => 'build-' + Date.now(),
  turbopack: {},
};

export default nextConfig;
