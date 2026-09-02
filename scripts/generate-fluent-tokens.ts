/**
 * Emits Fluent 2's design tokens as plain CSS custom properties.
 *
 * This is the whole point of the hybrid architecture: the RSC half of the app
 * styles itself with Tailwind against these variables, with no provider and no
 * runtime JavaScript, while the Fluent islands added in Phase 5 read the same
 * values from the same brand ramp at runtime. One source, two consumers, and a
 * `--check` mode so CI notices if the committed file drifts from it.
 *
 *   npm run tokens          rewrite src/styles/fluent-tokens.css
 *   npm run tokens:check    fail if the committed file is stale
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { createDarkTheme, createLightTheme } from "@fluentui/react-theme";

import { noqtaBrand } from "../src/theme/noqta-brand";
import {
  noqtaPaperDark,
  noqtaPaperLight,
  withPaper,
} from "../src/theme/noqta-paper";

const OUT = path.join(process.cwd(), "src", "styles", "fluent-tokens.css");

type Theme = Record<string, string | number>;

/*
 * The brand ramp is a parameter of Fluent's theme builders; the neutral ramp
 * is not — it is baked into them as grey. So the paper neutrals are folded in
 * afterwards, by the same function `FluentShell` calls on the runtime theme.
 * That is what keeps a dialog the same colour as the page behind it.
 */
const light = withPaper(
  createLightTheme(noqtaBrand) as unknown as Theme,
  noqtaPaperLight,
);
const dark = withPaper(
  createDarkTheme(noqtaBrand) as unknown as Theme,
  noqtaPaperDark,
);

/** Fluent's own provider emits `--colorNeutralBackground1`; match it exactly. */
const declaration = (name: string, value: string | number) =>
  `  --${name}: ${value};`;

function block(theme: Theme, only?: (name: string) => boolean) {
  return Object.keys(theme)
    .sort()
    .filter((name) => (only ? only(name) : true))
    .map((name) => declaration(name, theme[name]))
    .join("\n");
}

/** Dark blocks carry only what actually differs, so the diff stays readable. */
const differs = (name: string) => dark[name] !== light[name];

const changedCount = Object.keys(light).filter(differs).length;

const css = `/*
 * GENERATED — do not edit.
 *
 * Source: @fluentui/react-theme + src/theme/noqta-brand.ts
 *         + src/theme/noqta-paper.ts (the warm neutral ramp)
 * Rebuild: npm run tokens
 * Verify:  npm run tokens:check
 *
 * ${Object.keys(light).length} tokens, ${changedCount} of which differ between themes.
 *
 * The three-block shape mirrors globals.css: a light default, a
 * prefers-dark block guarded so an explicit light choice still wins, and an
 * explicit [data-theme="dark"] block so the in-app toggle wins both ways.
 */

:root {
${block(light)}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${block(dark, differs)
  .split("\n")
  .map((line) => "  " + line)
  .join("\n")}
  }
}

[data-theme="dark"] {
${block(dark, differs)}
}
`;

/*
 * Compared with the line endings normalised, because the comparison is about
 * the tokens and not about how the checkout wrote them. On Windows with
 * `core.autocrlf=true` git rewrites this file to CRLF while the generator
 * emits LF, so a byte-for-byte hash reported a stale file on every fresh
 * clone even when every token matched.
 */
const hash = (value: string) =>
  createHash("sha256")
    .update(value.split("\r\n").join("\n"))
    .digest("hex")
    .slice(0, 12);

if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = readFileSync(OUT, "utf8");
  } catch {
    console.error("fluent-tokens.css is missing — run `npm run tokens`");
    process.exit(1);
  }

  if (hash(current) !== hash(css)) {
    console.error(
      "fluent-tokens.css is out of date with the brand ramp — run `npm run tokens`",
    );
    process.exit(1);
  }

  console.log(`fluent-tokens.css is in sync (${Object.keys(light).length} tokens)`);
} else {
  writeFileSync(OUT, css, "utf8");
  console.log(
    `wrote ${path.relative(process.cwd(), OUT)} — ${Object.keys(light).length} tokens, ${changedCount} theme-dependent`,
  );
}
