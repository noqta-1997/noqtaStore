import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import AxeBuilder from "@axe-core/playwright";
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
 * The accessibility half of the gated baseline.
 *
 * `axe.spec.ts` scans the pages anyone can reach; this scans the six behind a
 * login. The split exists because the suite never signs itself in — see
 * `visual/gated.spec.ts` for the one command that provides a session — so
 * these have to be able to skip on their own.
 *
 * The report is written beside the public one under a `gated-` prefix rather
 * than merged into it. Two spec files cannot write the same file without one
 * clobbering the other, and keeping them apart also keeps the public numbers
 * comparable across the runs where no session exists.
 */

const REPORT_DIR = path.join(process.cwd(), "tests", "__a11y__");

interface Finding {
  page: string;
  locale: string;
  theme: string;
  project: string;
  url: string;
  violations: {
    id: string;
    impact: string | null | undefined;
    nodes: number;
    help: string;
    targets: string[];
  }[];
  total: number;
}

const collected: Finding[] = [];

test.afterAll(async ({}, testInfo) => {
  if (collected.length === 0) return;

  mkdirSync(REPORT_DIR, { recursive: true });

  const byRule = new Map<string, number>();
  for (const entry of collected) {
    for (const violation of entry.violations) {
      byRule.set(violation.id, (byRule.get(violation.id) ?? 0) + violation.nodes);
    }
  }

  const report = {
    capturedAt: new Date().toISOString(),
    project: testInfo.project.name,
    pagesScanned: collected.length,
    totalViolationNodes: collected.reduce((sum, entry) => sum + entry.total, 0),
    byRule: Object.fromEntries([...byRule.entries()].sort((a, b) => b[1] - a[1])),
    detail: collected,
  };

  writeFileSync(
    path.join(REPORT_DIR, `gated-${testInfo.project.name}.json`),
    JSON.stringify(report, null, 2),
    "utf8",
  );
});

test.describe("a11y · authenticated", () => {
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

        // A stale session lands on /login, and scanning that page instead
        // would quietly report the login form's numbers as the admin's.
        expect(page.url(), "session expired — regenerate tests/.auth/user.json")
          .not.toContain("/login");

        await assertTheme(page, theme);
        await settle(page, pageCase.ready);

        const results = await new AxeBuilder({ page })
          // Tabster's focus sentinels — excluded for the reason set out in
          // axe.spec.ts, which verified them before excluding them.
          .exclude("[data-tabster-dummy]")
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();

        collected.push({
          page: pageCase.id,
          locale,
          theme,
          project: testInfo.project.name,
          url: pageCase.path(locale),
          violations: results.violations.map((violation) => ({
            id: violation.id,
            impact: violation.impact,
            nodes: violation.nodes.length,
            help: violation.help,
            targets: violation.nodes
              .slice(0, 12)
              .map((node) => node.target.join(" "))
              .sort(),
          })),
          total: results.violations.reduce(
            (sum, violation) => sum + violation.nodes.length,
            0,
          ),
        });

        // Recorded, not enforced — the same rule the public scan follows.
        testInfo.annotations.push({
          type: "a11y",
          description: `${results.violations.length} rule(s) violated`,
        });
      });
    }
  }
});
