<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Design system — Fluent 2

The UI runs on Microsoft Fluent 2. Not a visual imitation of it: the tokens are
generated from Microsoft's own theme package, with Noqta's indigo (`#3b5bfd`)
substituted for the default brand ramp and a cool, faintly blue neutral ramp
substituted for Fluent's grey. The brand was orange on cream paper until the
store was recut on a neutral dashboard reference in September 2026; the ramp
files are what made that a two-file change.

## The three layers

1. **`src/theme/noqta-brand.ts`** and **`src/theme/noqta-paper.ts`** — the
   16-step brand ramp and the neutral ramp, plain data with no imports.
   Everything below reads from them, which is what stops them drifting.
   Fluent's own neutrals are dead grey and this design's carry a blue cast,
   so `withPaper()` folds the neutral ramp into the theme in both consumers:
   the generator and `FluentShell`. (The file keeps its "paper" name from the
   cream design it was written for; the shape and the consumers are the same.)
2. **`src/styles/fluent-tokens.css`** — 459 CSS variables, **generated**.
   Never edit it. `npm run tokens` rewrites it; `npm run tokens:check` fails
   the build if it is stale.
3. **`src/app/globals.css`** — semantic aliases (`--card`, `--line`,
   `--primary-container`) pointing at the Fluent tokens. This is the file to
   edit when a colour decision changes; edit the ramps for a palette change.

Every mapping and the reasoning behind it is in `docs/token-audit.md`. Read it
before changing a token — several of them serve two roles and break if moved
alone.

## RSC and the Fluent islands

Fluent UI React v9 is confined to client components that were already client
components. **All 56 pages and every layout are Server Components**, and they
must stay that way.

- `FluentShell` (`src/components/fluent/`) is the single client boundary. The
  root layout passes `children` straight through it, so nothing below is
  pulled into the client bundle.
- Fluent components belong in `Dialog`, `Drawer`, `Menu`, `Popover`, `Toaster`
  and `TabList` — places with focus trapping or keyboard navigation worth
  importing.
- **Do not** reach for Fluent for buttons, inputs or selects. Eight of nine
  `Select` call sites are Server Components submitting through `FormData`;
  converting one would force `"use client"` up the tree.

## Rules worth knowing before you edit

- **`cn()` is configured.** `lib/utils.ts` tells tailwind-merge which `text-*`
  classes are font sizes. Adding a semantic font-size step without listing it
  there will make tailwind-merge silently drop colour classes.
- **Griffel forbids CSS shorthands.** Inside `makeStyles`, write
  `borderInlineStartWidth`/`Style`/`Color`, not `borderInlineStart`.
- **Font variables live on `<html>`.** `--font-sans` is declared on `:root` and
  references them; on `<body>` the nested `var()` would be undefined and the
  whole declaration dropped.
- **Radii are shifted one Fluent step.** `rounded-md` is 8px, `lg` 12, `xl` 16,
  `2xl` 24. The names did not change, so do not "fix" a call site that looks
  rounder than you expected.
- **There is no monospace.** `--font-mono` resolves to the sans stack and
  `label-mono` is a small semibold sans label. The name survives only because
  30-odd call sites say it. `[data-numeric]` still selects tabular figures.
- **One face, two weights.** Almarai is the whole store — body, headings and
  figures — served from `public/fonts/` as a Regular and a Bold, `.woff2`
  only: `next/font/local` makes a separate `@font-face` of every `src` entry,
  so a `.woff` "fallback" beside the `.woff2` is downloaded as well, not
  instead. 500 resolves down to the Regular and 600 up to the Bold.
  `--font-display` still exists and still resolves to Almarai; `font-display`
  marks headings and the wordmark as a role, not a different face.
- **The store is Arabic only.** There is no `[locale]` segment, no `/ar`
  prefix and no English dictionary; `Locale` has one member and every page
  reads `defaultLocale`. `src/i18n/config.ts` explains what was kept and why.
- **Colour is rationed.** `--primary-container` is for the one action on a
  view; chart marks use `--data`, a deliberately muted step, so a dashboard
  does not read as a page of buttons. Amber (`--gold`) means a rating and
  nothing else — a chip is never gold.

## Before you ship a change

```bash
npm run test:functional   # the contract — must always be green
npm run test:visual       # compare against the committed baseline
npm run test:a11y         # currently zero violations; keep it there
npm run tokens:check      # the generated CSS matches the ramp
```

`tests/README.md` covers the suite in full, including why the baselines must
always be captured against `next dev` and why synthetic clicks do not work on
these components.
