import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { test } from "@playwright/test";

import { LOCALES, PUBLIC_PAGES } from "../fixtures/pages";
import { assertTheme, seedTheme, settle, type Theme } from "../fixtures/harness";

/**
 * Accessibility baseline, recorded before any Fluent 2 change lands.
 *
 * This run deliberately does not fail on existing violations. The audit
 * already found real gaps (no focus trap in dialogs, a single-colour focus
 * ring, tables without sort semantics) and failing on them now would only
 * block the migration that is meant to fix them.
 *
 * What it produces is the reference file. From the next phase on, the rule is
 * that the counts here may go down but never up.
 */

/**
 * Committed on purpose. `test-results/` is disposable run output, but this is
 * the reference every later phase is measured against, so it lives with the
 * screenshots instead.
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
    /** Kept so a later run can say *which* element regressed, not just how many. */
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
    path.join(REPORT_DIR, `baseline-${testInfo.project.name}.json`),
    JSON.stringify(report, null, 2),
    "utf8",
  );
});

for (const locale of LOCALES) {
  test.describe(`a11y · ${locale}`, () => {
    for (const pageCase of PUBLIC_PAGES) {
      test(`${pageCase.id}`, async ({ page }, testInfo) => {
        const theme: Theme = testInfo.project.name.endsWith("-dark")
          ? "dark"
          : "light";

        await seedTheme(page, theme);
        await page.goto(pageCase.path(locale), { waitUntil: "domcontentloaded" });
        await assertTheme(page, theme);
        await settle(page, pageCase.ready);

        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          /*
           * Tabster — Fluent's focus manager — puts two sentinels on the page:
           * `<i tabindex="0" role="none" aria-hidden="true" data-tabster-dummy>`.
           * axe reads those as aria-hidden-focus, 200 nodes of it.
           *
           * Verified before excluding: focusing either one redirects to a real
           * link within a frame, so neither ever becomes a resting focus
           * target and the harm the rule guards against cannot occur. They are
           * excluded so the gate keeps measuring this app rather than Fluent's
           * internals — not because the rule was inconvenient.
           */
          .exclude("[data-tabster-dummy]")
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

        // Recorded, not enforced — see the note at the top of this file.
        testInfo.annotations.push({
          type: "a11y",
          description: `${results.violations.length} rule(s) violated`,
        });
      });
    }
  });
}
