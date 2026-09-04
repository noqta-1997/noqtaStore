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
 * `global-setup.ts` signs in once per run when `.env.local` carries
 * `E2E_EMAIL` and `E2E_PASSWORD`, and saves the state to
 * `tests/.auth/user.json`. Without them there is no session and these tests
 * skip, so the account and admin halves of the baseline stay an explicit,
 * visible gap rather than a silent one.
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
        test.skip(
          pageCase.volatile === true,
          "content is derived from the current date — accessibility only",
        );

        const theme: Theme = testInfo.project.name.endsWith("-dark")
          ? "dark"
          : "light";

        await seedTheme(page, theme);
        await page.goto(pageCase.path(locale), { waitUntil: "domcontentloaded" });

        // Two ways to land somewhere else: an expired session redirects to
        // /login, and an account that is not the owner is redirected off
        // /admin to the storefront. Both would be captured as a baseline of
        // the wrong page, so check the path rather than just the first case.
        expect(
          new URL(page.url()).pathname,
          "landed on another page — see the sign-in note in global-setup.ts",
        ).toBe(pageCase.path(locale));

        await assertTheme(page, theme);
        await settle(page, pageCase.ready);

        await expect(page).toHaveScreenshot(`${pageCase.id}-${locale}.png`, {
          fullPage: true,
        });
      });
    }
  }
});
