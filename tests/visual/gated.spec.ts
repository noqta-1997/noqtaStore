import { expect, test } from "@playwright/test";

import { GATED_PAGES, LOCALES } from "../fixtures/pages";
import {
  STORAGE_STATE,
  assertTheme,
  hasSession,
  seedTheme,
  settle,
  type Theme,
} from "../fixtures/harness";

/**
 * Baselines for the pages behind a login.
 *
 * The suite never creates an account or types a password. To include these
 * pages, sign in once by hand and save the browser state to
 * `tests/.auth/user.json`:
 *
 *   npx playwright open --save-storage=tests/.auth/user.json http://localhost:3000/ar/login
 *
 * The file is gitignored. Until it exists these tests skip, so the account and
 * admin halves of the baseline stay an explicit, visible gap rather than a
 * silent one.
 */

test.describe("visual · authenticated", () => {
  test.skip(
    () => !hasSession(),
    "no tests/.auth/user.json — sign in once to include account and admin pages",
  );

  test.use({ storageState: STORAGE_STATE });

  for (const locale of LOCALES) {
    for (const pageCase of GATED_PAGES) {
      test(`${pageCase.id} · ${locale}`, async ({ page }, testInfo) => {
        const theme: Theme = testInfo.project.name.endsWith("-dark")
          ? "dark"
          : "light";

        await seedTheme(page, theme);
        await page.goto(pageCase.path(locale), { waitUntil: "domcontentloaded" });

        // A stale session lands on /login; that is a setup problem, not a diff.
        expect(page.url(), "session expired — regenerate tests/.auth/user.json")
          .not.toContain("/login");

        await assertTheme(page, theme);
        await settle(page, pageCase.ready);

        await expect(page).toHaveScreenshot(`${pageCase.id}-${locale}.png`, {
          fullPage: true,
        });
      });
    }
  }
});
