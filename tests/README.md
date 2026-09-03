# Migration baseline suite

This suite exists for one job: to prove that each phase of the Fluent 2
migration changed only what it set out to change. It is not a general test
suite and it does not try to be one.

## The three layers

| Layer | Location | What a failure means |
| --- | --- | --- |
| Functional contract | `functional/` | **A regression.** The phase stops. |
| Visual baseline | `visual/` | A diff to review — expected during the migration. |
| Accessibility baseline | `a11y/` | Recorded, not enforced. Counts may fall, never rise. |

The distinction matters. Every phase after this one is *supposed* to produce
visual diffs; the rule is that each one is looked at and either accepted or
fixed. A functional failure is different in kind — the storefront must keep
working exactly as it does today.

## Running

```bash
npm run test              # everything
npm run test:functional   # the contract — must always be green
npm run test:visual       # compare against the committed baseline
npm run test:a11y         # rewrite the accessibility report
npm run test:report       # open the last HTML report
```

The dev server is started automatically and an existing one on port 3000 is
reused.

## Accepting a phase's visual changes

```bash
npm run test:visual                # see what moved
npm run test:report                # review every diff by eye
npm run test:baseline              # accept them into the baseline
```

Never run `test:baseline` without reading the report first. Blind acceptance
turns the whole suite into decoration.

## The matrix

19 public pages × 2 locales × 2 themes × 3 viewports = **228 screenshots**.

Viewports are mobile 375×812, tablet 768×1024 and desktop 1440×900. Themes are
seeded through `localStorage`, the same key the app's own pre-paint script
reads, so the capture goes through the real code path rather than around it.

## Two things that will bite you

**Warm the server.** `next dev` compiles each route on first request. The very
first run of the functional suite failed seven tests purely from that and
passed all of them warm. `global-setup.ts` now walks every route first — if
you bypass it, expect false failures.

**Use real input.** `element.click()` and `new KeyboardEvent(...)` do not drive
these components; only Playwright's real input path does. This cost several
wrong diagnoses during the Phase 0 spike. Also allow for exit animations: a
dialog stays in the DOM for a moment after it is logically closed, so assert on
what the user can see, not on whether a node still exists.

**The ratio is blind to small text.** `maxDiffPixelRatio` is 0.002 of a
**full-page** capture, which on a 1440-wide page is several thousand pixels —
more than a line of placeholder text occupies. Rewording the header search
placeholder changed 180 of the 228 baselines and the suite passed on every one
of them. If a change is copy rather than layout, re-capture with
`--update-snapshots=all` and read `git status`: `--update-snapshots` on its own
only rewrites snapshots that already failed, so it will do nothing.

**Capture mode must stay constant.** These baselines were taken against
`next dev`. Comparing them to a production build would report differences that
belong to the build, not to the migration.

## Pages behind a login

The suite never creates an account and never types a password. To include the
account and admin pages, sign in once by hand and save the session:

```bash
npx playwright open --save-storage=tests/.auth/user.json http://localhost:3000/ar/login
```

Two things the command does not say out loud. The path is **relative to where
you run it**, so run it from the repository root or the file lands somewhere
else entirely. And the state is written when the **browser window is closed**,
not when the sign-in succeeds — closing the terminal instead leaves no file.
Check with `ls tests/.auth/` before assuming it worked.

`tests/.auth/` is gitignored. Until that file exists both `visual/gated.spec.ts`
and `a11y/gated.spec.ts` skip, so the six pages stay a visible gap rather than a
silent one. The accessibility report for them is written separately, as
`__a11y__/gated-<project>.json`: two spec files cannot write one file without
clobbering each other, and keeping them apart also keeps the public numbers
comparable across the runs where no session exists.

## What is committed

`tests/__screenshots__/` is the baseline and belongs in git. `test-results/`
and `playwright-report/` are run output and are ignored.
