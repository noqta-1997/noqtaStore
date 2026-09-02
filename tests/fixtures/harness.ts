import { existsSync } from "node:fs";
import path from "node:path";

import type { Page } from "@playwright/test";

import { THEME_STORAGE_KEY } from "@/lib/theme";

export type Theme = "light" | "dark";

/** Where a human-generated session is expected. Never created by the suite. */
export const STORAGE_STATE = path.join(process.cwd(), "tests", ".auth", "user.json");

export function hasSession() {
  return existsSync(STORAGE_STATE);
}

/**
 * The app decides its theme from `localStorage` in an inline script that runs
 * before first paint. Seeding the key is therefore the only honest way to pin
 * a theme — forcing `data-theme` afterwards would race that script.
 */
export async function seedTheme(page: Page, theme: Theme) {
  await page.addInitScript(
    ([key, value]) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        /* storage unavailable — the boot script falls back to the OS */
      }
    },
    [THEME_STORAGE_KEY, theme] as const,
  );
}

/**
 * Sets the theme on an already-loaded page instead of before every navigation.
 *
 * `seedTheme` re-runs on each load, so it silently overwrites whatever the
 * app itself persisted — which made the "theme survives a reload" test fail
 * against its own harness rather than against the app.
 */
export async function setThemeInPage(page: Page, theme: Theme) {
  await page.evaluate(
    ([key, value]) => window.localStorage.setItem(key, value),
    [THEME_STORAGE_KEY, theme] as const,
  );
}

/**
 * Screenshots are only trustworthy once the things that move have stopped.
 * Phase 0 showed that asserting too early reports failures that are really
 * just unfinished animation, so this waits on the real signals.
 */
export async function settle(page: Page, ready?: string) {
  if (ready) {
    await page.locator(ready).first().waitFor({ state: "visible", timeout: 20_000 });
  }

  // `next dev` paints a floating dev-tools badge over the page. It comes and
  // goes on its own schedule and was the single source of flake in the first
  // baseline run — one screenshot in 156 differed by exactly that badge.
  await page.addStyleTag({
    content: "nextjs-portal, next-route-announcer { display: none !important; }",
  });

  // Webfonts shift metrics after paint; baselines taken before this flicker.
  await page.evaluate(() => document.fonts.ready);

  // Lazy covers below the fold would otherwise load mid-capture.
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let last = -1;
      const step = () => {
        window.scrollTo(0, document.body.scrollHeight);
        if (document.body.scrollHeight === last) {
          window.scrollTo(0, 0);
          resolve();
          return;
        }
        last = document.body.scrollHeight;
        requestAnimationFrame(step);
      };
      step();
    });
  });

  await page.waitForLoadState("load");
}

/** Verifies the theme actually took effect, so a silent miss cannot pass. */
export async function assertTheme(page: Page, theme: Theme) {
  const applied = await page.evaluate(
    () => document.documentElement.getAttribute("data-theme"),
  );

  if (applied !== theme) {
    throw new Error(`theme not applied: expected ${theme}, got ${applied ?? "none"}`);
  }
}
