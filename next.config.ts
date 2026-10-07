import type { NextConfig } from "next";
import { realpathSync } from "node:fs";
import path from "node:path";
// Worktrees share dependencies with the repository root.
const dependencyRoot = path.dirname(realpathSync(path.join(process.cwd(), "node_modules")));
const config: NextConfig = {
  turbopack: { root: dependencyRoot },
  async headers() {
    return [
      {
        source: "/textures/ascend-environment.bin.gz",
        headers: [
          { key: "Content-Encoding", value: "gzip" },
          { key: "Content-Type", value: "application/octet-stream" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
    ];
  },
};
export default config;
