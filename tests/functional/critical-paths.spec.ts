import { expect, test } from "@playwright/test";

import { GATED_PAGES } from "../fixtures/pages";
import { setThemeInPage, settle } from "../fixtures/harness";

/**
 * The contract the migration must not break.
 *
 * Unlike the visual baseline, nothing here is allowed to change. A diff in a
 * screenshot is a design decision; a failure in this file is a regression, and
 * it stops the phase.
 *
 * Phase 0 established that synthetic events (`el.click()`, `new KeyboardEvent`)
 * do not drive real component behaviour, so every interaction below goes
 * through Playwright's real input path.
 */

const isDesktop = (name: string) => name.startsWith("desktop");
const isMobile = (name: string) => name.startsWith("mobile");

test.describe("storefront renders real data", () => {
  test("home lists books and categories", async ({ page }) => {
    await page.goto("/ar", { waitUntil: "domcontentloaded" });
    await settle(page, "main h1");

    await expect(page.locator("article")).not.toHaveCount(0);
    await expect(page.locator('a[href^="/ar/books/"]').first()).toBeVisible();
    await expect(page.locator('a[href^="/ar/categories/"]').first()).toBeVisible();
  });

  test("book detail shows title, price and a cart control", async ({ page }) => {
    await page.goto("/ar/books/al-amir-al-saghir", { waitUntil: "domcontentloaded" });
    await settle(page, "main h1");

    await expect(page.locator("main h1")).not.toBeEmpty();
    await expect(page.locator("[data-numeric]").first()).toBeVisible();
    await expect(page.getByRole("button").first()).toBeVisible();
  });

  test("search returns results for a seeded title", async ({ page }) => {
    await page.goto("/ar/search?q=1984", { waitUntil: "domcontentloaded" });
    await settle(page, "main");

    await expect(page.locator("main")).toContainText(/1984/);
  });

  test("catalogue sort is URL-driven and survives a reload", async ({ page }) => {
    await page.goto("/ar/books?sort=newest", { waitUntil: "domcontentloaded" });
    await settle(page, "main");

    const before = await page.locator("main").innerText();

    await page.reload({ waitUntil: "domcontentloaded" });
    await settle(page, "main");

    expect(await page.locator("main").innerText()).toBe(before);
    expect(page.url()).toContain("sort=newest");
  });

  test("cart page renders for an anonymous visitor", async ({ page }) => {
    await page.goto("/ar/cart", { waitUntil: "domcontentloaded" });
    await settle(page, "main");
    await expect(page.locator("main")).toBeVisible();
  });

  test("unknown route renders the not-found page", async ({ page }) => {
    const response = await page.goto("/ar/this-route-does-not-exist", {
      waitUntil: "domcontentloaded",
    });

    expect(response?.status()).toBe(404);
    await expect(page.locator("main, body")).toContainText(/./);
  });
});

test.describe("authorisation", () => {
  for (const gated of GATED_PAGES) {
    test(`${gated.id} redirects an anonymous visitor to login`, async ({ page }) => {
      await page.goto(gated.path("ar"), { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/ar\/login/);
    });
  }
});

test.describe("locale", () => {
  test("switching language keeps the reader on the same page", async ({ page }, info) => {
    test.skip(!isDesktop(info.project.name), "switcher is desktop-only chrome");

    await page.goto("/ar/books", { waitUntil: "domcontentloaded" });
    await settle(page, "main");

    await page.getByRole("link", { name: "English" }).click();
    await page.waitForURL(/\/en\/books/);

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("arabic renders right-to-left", async ({ page }) => {
    await page.goto("/ar", { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  });
});

test.describe("theme", () => {
  test("toggle flips the theme and remembers it across a reload", async ({
    page,
  }, info) => {
    test.skip(!isDesktop(info.project.name), "toggle sits in the desktop bar");

    // Deliberately not `seedTheme`: that re-seeds on every navigation and
    // would overwrite the very persistence this test is checking.
    await page.goto("/ar", { waitUntil: "domcontentloaded" });
    await setThemeInPage(page, "light");
    await page.reload({ waitUntil: "domcontentloaded" });
    await settle(page, "main h1");

    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    // The control is icon-only; its accessible name is the *target* theme.
    await page.locator("header button[aria-label]").last().click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});

test.describe("navigation", () => {
  test("mobile drawer opens and lists the main links", async ({ page }, info) => {
    test.skip(!isMobile(info.project.name), "drawer is mobile-only");

    await page.goto("/ar", { waitUntil: "domcontentloaded" });
    await settle(page, "main h1");

    await page.locator("header button[aria-expanded]").first().click();

    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await expect(drawer.locator("a").first()).toBeVisible();
  });

  test("skip link reaches the main landmark by keyboard", async ({ page }) => {
    await page.goto("/ar", { waitUntil: "domcontentloaded" });
    await settle(page, "main h1");

    await page.keyboard.press("Tab");

    const focused = page.locator(":focus");
    await expect(focused).toHaveAttribute("href", /#main/);

    await page.keyboard.press("Enter");
    expect(page.url()).toContain("#main");
  });
});
