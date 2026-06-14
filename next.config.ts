import type { NextConfig } from "next";

const BUILD_TIMESTAMP = new Date().toISOString()

const nextConfig: NextConfig = {
  output: 'export',
  generateBuildId: async () => 'build-' + Date.now(),
  turbopack: {},
  typescript: { ignoreBuildErrors: false },
  excludeDefaultMomentLocales: true,
  env: {
    NEXT_PUBLIC_BUILD_TIME: BUILD_TIMESTAMP,
  },
};

export default nextConfig;
