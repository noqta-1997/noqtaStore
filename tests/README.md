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

(16 public + 12 gated pages) × 2 themes × 3 viewports = **168 screenshots**.
The two `volatile` admin pages are scanned for accessibility but not captured.

There used to be a second axis: every page was captured in Arabic and in
English, which is why the filenames still end in `-ar`. English left the store
in September 2026 and the suffix stayed, so the baselines did not all have to
be renamed for a language that no longer exists.

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

**Script-driven motion is held by `reducedMotion`.** `animations: "disabled"`
freezes CSS only. The home hero's showcase is scrolled from script (Embla), and
its autoplay would put a different jacket — or half of one — in every capture.
The config emulates `prefers-reduced-motion: reduce`, which the showcase reads
to stay on its first jacket and to jump rather than glide when a thumbnail is
picked. Anything else that moves from script should read the same preference
rather than be special-cased here.

## Pages behind a login

`global-setup.ts` signs in for you, once per run, if the machine has been told
how. Add two lines to `.env.local` — the same gitignored file the app already
keeps its Supabase keys in:

```
E2E_EMAIL=<the account to capture as>
E2E_PASSWORD=<its password>
```

Nothing else is needed: the session is minted at the start of every run and
saved to `tests/.auth/user.json`, so an expired one repairs itself instead of
failing the suite a month later. Without both variables the step is skipped
and says so.

It drives the real login form rather than writing a cookie by hand. Auth is a
hosted Supabase project, and a forged session would prove the forgery works,
not that signing in does.

**Which account matters.** `src/lib/owner.ts` pins the admin role to one
literal address, and `pinOwnerRole` demotes everyone else on every sign-in —
by design, so a stray admin from a seed or a restored backup cannot survive a
single visit. A second account therefore cannot be made an admin, and the
admin half of the baseline can only be captured as the owner. Setup checks
this once and says which half you are getting, and both gated specs assert
the page they landed on is the page they asked for, so a non-owner session
fails loudly instead of quietly baselining the storefront as `/admin`.

`tests/.auth/` is gitignored. Until that file exists both `visual/gated.spec.ts`
and `a11y/gated.spec.ts` skip, so the fourteen pages stay a visible gap rather
than a silent one. What does *not* wait for a session is the functional check:
every gated page is asserted to redirect an anonymous visitor to /login, and
that runs today.

Two of the fourteen are marked `volatile` and are scanned for accessibility
only. `getAdminStats` measures against the first of the current month and
`getSalesSeries` walks the last twelve, so the dashboard and the report page
re-bucket every month: a screenshot of either expires on the first, and a
baseline that has to be re-captured monthly stops being a baseline. Everything
time-invariant about them — the shell, the navigation, the panel chrome — is
still covered by the other admin pages. The accessibility report for them is written separately, as
`__a11y__/gated-<project>.json`: two spec files cannot write one file without
clobbering each other, and keeping them apart also keeps the public numbers
comparable across the runs where no session exists.

## What is committed

`tests/__screenshots__/` is the baseline and belongs in git. `test-results/`
and `playwright-report/` are run output and are ignored.
