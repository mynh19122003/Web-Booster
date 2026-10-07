import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/admin", testMatch: "*.spec.ts", timeout: 120000, workers: 1,
  use: { baseURL: "http://localhost:3108", channel: "msedge", headless: true },
  webServer: { command: "npm run start -- --port 3108 --hostname localhost", url: "http://localhost:3108", reuseExistingServer: false, timeout: 60000 },
  reporter: "list",
});
