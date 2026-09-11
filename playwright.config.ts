import { defineConfig, devices } from "@playwright/test";

/**
 * Baseline harness for the Fluent 2 migration.
 *
 * The suite exists to prove that a migration phase changed only what it meant
 * to change. That makes reproducibility the whole point: the same server mode,
 * the same viewports and the same themes on every run. Capturing a baseline
 * against `next dev` and comparing it against a production build would report
 * differences that belong to the build, not to the migration.
 *
 * Theme is encoded in the project name (`desktop-dark`) rather than in `use`,
 * so the specs can read it without widening Playwright's option types.
 */

const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
} as const;

type ViewportName = keyof typeof VIEWPORTS;
type ThemeName = "light" | "dark";

function project(name: ViewportName, theme: ThemeName) {
  return {
    name: `${name}-${theme}`,
    use: {
      ...devices["Desktop Chrome"],
      viewport: VIEWPORTS[name],
      colorScheme: theme,
    },
  };
}

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  globalSetup: "./tests/global-setup.ts",
  snapshotPathTemplate:
    "{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}",

  // A visual baseline that races itself is not a baseline.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: {
    timeout: 20_000,
    toHaveScreenshot: {
      // Font rasterisation differs by a hair between runs on the same machine.
      maxDiffPixelRatio: 0.002,
      animations: "disabled",
      caret: "hide",
      scale: "css",
    },
  },

  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
  ],

  use: {
    baseURL: "http://localhost:3000",
    locale: "en-GB",
    timezoneId: "Asia/Baghdad",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
  },

  projects: [
    project("mobile", "light"),
    project("mobile", "dark"),
    project("tablet", "light"),
    project("tablet", "dark"),
    project("desktop", "light"),
    project("desktop", "dark"),
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
