import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The repo root has the Expo app's lockfile; pin Turbopack to this folder so it doesn't guess.
  turbopack: { root: path.join(__dirname) },
  // PGlite ships WebAssembly and data files; load it from node_modules at runtime rather than bundling it.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
