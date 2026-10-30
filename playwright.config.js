import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  /*Test File Location */
  testDir: "./src/tests",

  /* Run tests in files in parallel */
  fullyParallel: false,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  // forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: 0,

  timeout: 1000000,

  /* Opt out of parallel tests on CI. */
  workers: 1,

  /* To generate test reports */
  reporter: [
    ["html"],
    [
      "allure-playwright",
      { resultsDir: "./allure-results", detail: true, suiteTitle: true },
    ],
  ],

  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.STAGING_URL || "https://internaldev.paid.com",

    /* Collect trace when retrying the failed test. */
    trace: "retain-on-failure",

    /* Screenshots takes only when test failed */
    screenshot: "only-on-failure",

    /* Video records, But delete when Test passed */
    video: "retain-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1366, height: 768 },
        headless: false,
      },
    },
  ],
});
