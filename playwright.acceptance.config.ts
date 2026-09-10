import { defineConfig, devices } from "@playwright/test";

const dbUrl = process.env.E2E_DATABASE_URL ?? "";

export default defineConfig({
  testDir: "./tests/acceptance",
  globalSetup: "./tests/acceptance/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      testMatch: /acceptance\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://localhost:3000",
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
    env: {
      DATABASE_URL: dbUrl,
      DIRECT_URL: dbUrl,
      BETTER_AUTH_SECRET: "e2e-acceptance-secret-not-real-00000000",
      BETTER_AUTH_URL: "http://localhost:3000",
    },
  },
});
