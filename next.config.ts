import type { NextConfig } from "next";
const config: NextConfig = {
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
