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

  // A carousel is positioned from script once React has hydrated, and Embla
  // gives its track a 3D transform — a compositing layer — as it does so.
  // Capturing while that was still to come caught Chromium creating the
  // layer under the full-page metrics override, after which the strip was
  // drawn a hundred pixels from where the DOM said it was, for the rest of
  // the page's life. Wait for the transform; the page is then done moving.
  await page.waitForFunction(() =>
    Array.from(
      document.querySelectorAll('[aria-roledescription="carousel"] [aria-roledescription="slide"]'),
    ).every((slide) => (slide.parentElement as HTMLElement).style.transform !== ""),
  );

  // A cover that has loaded but not yet decoded paints softer than the same
  // cover a frame later — enough to fail the ratio on a tablet capture. Only
  // the loaded ones: a lazy cover off to the side of a strip never loads,
  // and waiting on it would never return.
  await page.evaluate(() =>
    Promise.race([
      Promise.all(
        Array.from(document.images)
          .filter((img) => img.complete && img.naturalWidth > 0)
          .map((img) => img.decode().catch(() => undefined)),
      ),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]),
  );

  // Then a few frames of quiet. Chrome rasterises a layer it has just
  // scrolled past or just composited at a low resolution first and redraws
  // it sharp a moment later; the hero's jacket, which sits on Embla's
  // composited track right after the scroll-through above, was captured
  // soft in one run and sharp in the next.
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 300)));
      }),
  );
}

/**
 * Verifies the theme actually took effect, so a silent miss cannot pass.
 *
 * On a page the server rendered, the boot script has set the attribute
 * before `domcontentloaded` and the first read is the only one. A real 404
 * is different: Next answers a `notFound()` thrown outside a Suspense
 * boundary with an empty error document that the client fills in, and the
 * inline script never runs there — the app applies the stored theme itself
 * once it has rendered. So the check waits, briefly, for the attribute to
 * appear rather than reading it once at a moment that document cannot meet.
 */
export async function assertTheme(page: Page, theme: Theme) {
  const read = () =>
    page.evaluate(() => document.documentElement.getAttribute("data-theme"));

  let applied = await read();
  const deadline = Date.now() + 5_000;

  while (applied !== theme && Date.now() < deadline) {
    await page.waitForTimeout(100);
    applied = await read();
  }

  if (applied !== theme) {
    throw new Error(`theme not applied: expected ${theme}, got ${applied ?? "none"}`);
  }
}
