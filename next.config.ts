import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  generateBuildId: async () => 'build-' + Date.now(),
  turbopack: {},
  typescript: { ignoreBuildErrors: false },
  // Exclure les Edge Functions Deno (elles ont leur propre runtime)
  excludeDefaultMomentLocales: true,
};

export default nextConfig;
