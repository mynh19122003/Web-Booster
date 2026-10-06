import { defineConfig } from "@playwright/test";
const production = process.env.ADMIN_TEST_PRODUCTION === "1";
const port = production ? 3002 : 3001;
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: "./tests/admin",
  timeout: 120000,
  expect: { timeout: 15000 },
  workers: 1,
  use: {
    baseURL,
    trace: "retain-on-failure",
    channel: "msedge",
    headless: true,
    viewport: { width: 1440, height: 1000 },
  },
  webServer: {
    command: production
      ? "npm run start -- --hostname 127.0.0.1 --port 3002"
      : "npm run dev -- --webpack --hostname 127.0.0.1 --port 3001",
    url: `${baseURL}/admin/login`,
    reuseExistingServer: false,
    timeout: 120000,
  },
  reporter: "list",
});
