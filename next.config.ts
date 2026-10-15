import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // v1 has no backend: `next build` writes a static site to out/.
  // Cache Components / Partial Prefetching (create-next-app defaults) are left off:
  // they need a server and the build fails with "PPR cannot be enabled in export mode".
  output: "export",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
