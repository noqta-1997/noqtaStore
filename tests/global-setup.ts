import { chromium, type FullConfig } from "@playwright/test";

import { LOCALES, PUBLIC_PAGES } from "./fixtures/pages";

/**
 * Warms every route before the suite starts.
 *
 * `next dev` compiles a route on its first request. Without this, the first
 * test to reach each page pays that cost and times out, which reads as a
 * failure of the page rather than of the server. The very first run of the
 * functional suite failed seven tests for exactly this reason and passed all
 * of them on the second, warm run — the kind of flake that would make every
 * later phase comparison untrustworthy.
 */
async function globalSetup(config: FullConfig) {
  const baseURL =
    config.projects[0]?.use?.baseURL ?? "http://localhost:3000";

  const browser = await chromium.launch();
  const page = await browser.newPage();

  const targets = LOCALES.flatMap((locale) =>
    PUBLIC_PAGES.map((entry) => entry.path(locale)),
  );

  const started = Date.now();
  let compiled = 0;

  for (const target of targets) {
    try {
      await page.goto(`${baseURL}${target}`, {
        waitUntil: "domcontentloaded",
        timeout: 120_000,
      });
      compiled += 1;
    } catch {
      // A route that will not warm will fail loudly in the suite itself,
      // which is a better place to report it than here.
    }
  }

  await browser.close();

  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`\n  warmed ${compiled}/${targets.length} routes in ${seconds}s\n`);
}

export default globalSetup;
