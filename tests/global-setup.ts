import { mkdirSync } from "node:fs";
import path from "node:path";

import { config as loadEnv } from "dotenv";
import { chromium, type Browser, type FullConfig } from "@playwright/test";

import { GATED_PAGES, LOCALES, PUBLIC_PAGES } from "./fixtures/pages";
import { STORAGE_STATE } from "./fixtures/harness";

loadEnv({ path: ".env.local" });

/**
 * Signs in once, if the machine has been told how.
 *
 * The suite reads `E2E_EMAIL` and `E2E_PASSWORD` from `.env.local` — which is
 * gitignored, is the same file the app already keeps its Supabase keys in, and
 * never reaches this repository. Without both, this step is skipped and the
 * gated specs skip with it; the run stays green and the gap stays visible.
 *
 * It drives the real login form rather than writing a cookie by hand. Auth is
 * a hosted Supabase project, so a forged session would prove the forgery
 * works, not that signing in does.
 *
 * One thing worth knowing before setting these: `src/lib/owner.ts` pins the
 * admin role to a single literal address, and `pinOwnerRole` demotes anyone
 * else on every sign-in. Any account but that one reaches the account pages
 * and is redirected away from `/admin`, so the admin captures need the owner.
 */
async function saveSession(browser: Browser, baseURL: string) {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    console.log(
      "  no E2E_EMAIL / E2E_PASSWORD in .env.local — gated pages will skip",
    );
    return false;
  }

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${baseURL}/ar/login`, { waitUntil: "domcontentloaded" });
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.click('button[type="submit"]');

    // Supabase answers, the app redirects through /auth/after-sign-in, and the
    // reader lands on a page that is not the login form.
    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 30_000,
    });

    // Whether this account is the owner decides whether the admin half of the
    // baseline is capturable at all, so find out now rather than one screenshot
    // at a time.
    await page.goto(`${baseURL}/ar/admin`, { waitUntil: "domcontentloaded" });
    const isAdmin = page.url().includes("/admin");

    mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });
    await context.storageState({ path: STORAGE_STATE });

    console.log(
      isAdmin
        ? "  signed in as the owner — account and admin pages both captured"
        : "  signed in, but this account is not the owner: admin pages will\n" +
          "  redirect to the storefront and their captures would be wrong",
    );

    return true;
  } catch (error) {
    // A wrong password should not take the other 594 tests down with it.
    console.log(
      `  sign-in failed (${error instanceof Error ? error.message.split("\n")[0] : "unknown"})` +
        " — gated pages will skip",
    );
    return false;
  } finally {
    await context.close();
  }
}

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
  const baseURL = config.projects[0]?.use?.baseURL ?? "http://localhost:3000";

  const browser = await chromium.launch();
  const signedIn = await saveSession(browser, baseURL);

  // Signed out, a gated route compiles only the redirect, so warming those
  // pages is worth doing only once there is a session to reach them with.
  const context = signedIn
    ? await browser.newContext({ storageState: STORAGE_STATE })
    : await browser.newContext();
  const page = await context.newPage();

  const pages = signedIn ? [...PUBLIC_PAGES, ...GATED_PAGES] : PUBLIC_PAGES;
  const targets = LOCALES.flatMap((locale) =>
    pages.map((entry) => entry.path(locale)),
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
