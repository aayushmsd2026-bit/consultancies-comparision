import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3100);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // One retry and a patient timeout: a slow computer must not make a good build look broken.
  retries: 1,
  expect: { timeout: 10_000 },
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "off",
  },
  projects: [
    // A small phone first. This is the main device for our visitors.
    { name: "phone", testIgnore: /admin\.spec/, use: { ...devices["Pixel 7"], viewport: { width: 360, height: 780 } } },
    { name: "tablet", testIgnore: /admin\.spec/, use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } } },
    { name: "desktop", testIgnore: /admin\.spec/, use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    // The admin tests change shared data and refresh cached pages.
    // They run once, after everything else, so they cannot disturb the other tests.
    {
      name: "admin",
      testMatch: /admin\.spec/,
      dependencies: ["phone", "tablet", "desktop"],
      // These tests build on each other, so a retry of one would start from the wrong state.
      retries: 0,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}/en`,
    // Always a fresh build, so the tests never run against old code.
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
