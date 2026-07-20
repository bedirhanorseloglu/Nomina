import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // output: "export",
  trailingSlash: true,
  outputFileTracingRoot: projectDir,
  turbopack: {
    root: projectDir,
  },
};

export default nextConfig;
