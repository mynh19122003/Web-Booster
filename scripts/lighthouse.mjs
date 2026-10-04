import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";

const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--port",
    "3100",
    "--hostname",
    "127.0.0.1",
  ],
  { stdio: "ignore", windowsHide: true },
);
let browser;
try {
  let available = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch("http://127.0.0.1:3100");
      if (response.ok) {
        available = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!available)
    throw new Error("Production server did not start on port 3100");
  browser = await launch({
    chromePath:
      process.env.CHROME_PATH ||
      (process.platform === "win32"
        ? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
        : undefined),
    chromeFlags: ["--headless", "--no-sandbox", "--enable-unsafe-swiftshader"],
  });
  await mkdir("test-results", { recursive: true });
  for (const mode of ["desktop", "mobile"]) {
    const result = await lighthouse("http://127.0.0.1:3100", {
      port: browser.port,
      output: "json",
      logLevel: "error",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      ...(mode === "desktop"
        ? {
            formFactor: "desktop",
            screenEmulation: {
              mobile: false,
              width: 1440,
              height: 900,
              deviceScaleFactor: 1,
              disabled: false,
            },
            throttling: {
              rttMs: 40,
              throughputKbps: 10240,
              cpuSlowdownMultiplier: 1,
            },
          }
        : {}),
    });
    if (!result) throw new Error("No Lighthouse result");
    await writeFile(`test-results/lighthouse-${mode}.json`, result.report);
    console.log(
      mode,
      JSON.stringify(
        Object.fromEntries(
          Object.entries(result.lhr.categories).map(([key, value]) => [
            key,
            Math.round(value.score * 100),
          ]),
        ),
      ),
    );
    for (const [key, audit] of Object.entries(result.lhr.audits))
      if (audit.score !== null && audit.score < 0.9 && audit.details)
        console.log(key, audit.title, audit.displayValue || "");
  }
} finally {
  if (browser) await browser.kill();
  server.kill();
}
