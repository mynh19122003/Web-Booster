import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/admin",
  testMatch: "*.spec.ts",
  timeout: 120000,
  workers: 1,
  use: { baseURL: "http://localhost:3108", channel: "msedge", headless: true },
  webServer: [
    {
      command: "node tests/admin/backend-contract-server.mjs",
      url: "http://127.0.0.1:3109/health",
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command: "npm run start -- --port 3108 --hostname localhost",
      url: "http://localhost:3108",
      reuseExistingServer: false,
      timeout: 60000,
      env: { BACKEND_API_URL: "http://127.0.0.1:3109/api/v1" },
    },
  ],
  reporter: "list",
});
