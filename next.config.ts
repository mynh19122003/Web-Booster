import type { NextConfig } from "next";
const config: NextConfig = {
  async redirects() {
    return [{ source: "/games/tft", destination: "/games/teamfight-tactics", permanent: true }];
  },
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
