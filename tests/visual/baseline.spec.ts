import { expect, test } from "@playwright/test";

import { LOCALES, PUBLIC_PAGES } from "../fixtures/pages";
import { assertTheme, seedTheme, settle, type Theme } from "../fixtures/harness";

/**
 * Visual baseline: one full-page screenshot per page, locale, theme and
 * viewport. Nothing here asserts that the design is *good* — only that a
 * migration phase changed it exactly where it intended to.
 *
 * A diff is not automatically a failure. Every phase after this one is
 * expected to produce diffs; the rule is that each one is reviewed and either
 * accepted (baseline updated with `--update-snapshots`) or fixed.
 */

for (const locale of LOCALES) {
  test.describe(`visual · ${locale}`, () => {
    for (const page of PUBLIC_PAGES) {
      test(`${page.id}`, async ({ page: browserPage }, testInfo) => {
        const theme = testInfo.project.name.endsWith("-dark")
          ? "dark"
          : ("light" satisfies Theme);

        await seedTheme(browserPage, theme);
        await browserPage.goto(page.path(locale), { waitUntil: "domcontentloaded" });
        await assertTheme(browserPage, theme);
        await settle(browserPage, page.ready);

        await expect(browserPage).toHaveScreenshot(`${page.id}-${locale}.png`, {
          fullPage: true,
        });
      });
    }
  });
}
