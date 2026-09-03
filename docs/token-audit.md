# Token audit — Noqta → Fluent 2

Written in Phase 2 as the plan for the bridge; **applied in Phase 3**. The
mappings below are now what `src/app/globals.css` actually does.

Measured against `src/app/globals.css` after pruning — 29 live tokens, down
from 45. Phase 3 added five more, all of them splits forced by a token that
turned out to serve two roles at once; those are listed in
[What Phase 3 changed](#what-phase-3-changed).

---

## Method

Fluent equivalents were not chosen by name. Matching `--line` to
`colorNeutralStroke1` because both say "line" would have destroyed the
interface: the current token is near-black at **17.10:1** and the Fluent one is
**1.53:1**, an eleven-fold drop in the only structural device the design has.

Each token went through five questions instead:

1. What does it actually mean *in the code*, judged from every call site?
2. Which Fluent alias token carries that same meaning?
3. Does the mapping hold in both themes, checked separately?
4. Does it need hover / pressed / selected / disabled variants?
5. What is the measured contrast, before and after?

Anything without a real Fluent counterpart is recorded in
[No Fluent equivalent](#no-fluent-equivalent) rather than forced into one.

---

## What Phase 2 deleted

16 token names — 52 declaration lines across the three theme blocks and the
`@theme inline` export block.

| Token | Why |
| --- | --- |
| `--surface-dim`, `--surface-bright`, `--surface-container`, `--surface-container-lowest`, `--surface-container-highest`, `--surface-variant` | Exported to Tailwind, never used by a single utility |
| `--on-primary`, `--on-error` | Never used — the code writes `text-white` over brand and error fills instead |
| `--secondary`, `--on-secondary`, `--tertiary`, `--on-tertiary` | Material 3 roles the design never adopted |
| `--inverse-primary`, `--primary-fixed-dim`, `--on-primary-fixed`, `--on-primary-fixed-variant` | Declared but never exported and never referenced |

Verified visually neutral: the full 156-screenshot baseline passed with zero
diffs after the deletion.

The `*-container` halves of the secondary and tertiary families were **kept** —
`--secondary-container`, `--on-secondary-container`, `--tertiary-container` and
`--on-tertiary-container` each have live call sites.

---

## Colour tokens

Contrast is quoted against the surface each token actually sits on. `AA` is
4.5:1 for text, `3:1` is the threshold for UI borders and large text.

### Surfaces

| Token | Uses | Means | Fluent 2 | Light | Dark | Notes |
| --- | ---: | --- | --- | --- | --- | --- |
| `--card` | 93 | Raised surface — **not a card**; see the usage split below | `colorNeutralBackground1` | `#ffffff` | `#1e201e` | Rename to `--layer-raised`; needs Hover / Pressed / Selected |
| `--surface-container-high` | 80 | **Hover background**, not a resting surface | `colorSubtleBackgroundHover` | `#eee8da` | `#282a28` | The clearest trap in the whole audit — see below |
| `--surface` | 8 | Page ground | `colorNeutralBackground2` | `#fff9eb` | `#121412` | Clean match |
| `--surface-container-low` | 17 | Page-header band | `colorNeutralBackground3` | `#f9f3e5` | `#1a1c1a` | Clean match |

`--surface-container-high` is why name-based mapping fails. The obvious
counterpart by name is `colorNeutralBackground3`, a *resting* surface. But 79
of its 80 call sites are `hover:bg-surface-high`. Mapping it to a resting token
would make hover look identical to rest and silently delete the interaction
feedback across the whole app.

### Foregrounds

| Token | Uses | Means | Fluent 2 | Light | Dark | Notes |
| --- | ---: | --- | --- | --- | --- | --- |
| `--on-surface` | 157 | Primary text | `colorNeutralForeground1` | 17.10 | 12.72 | Clean match |
| `--muted` | 151 | Tertiary text | `colorNeutralForeground3` | 5.13 | 6.40 | **4.20 over `--surface-container-high` — fails AA today** |
| `--on-surface-variant` | 70 | Secondary text | `colorNeutralForeground2` | 9.38 | 9.62 | Dark value `#e1bfb5` is pink, not neutral — see below |

`--on-surface-variant` carries two jobs in dark mode. It is the secondary text
colour *and* the value `--outline-variant` was tuned against. Splitting them is
part of Phase 3, not a like-for-like swap.

### Strokes

| Token | Uses | Means | Fluent 2 | Light | Dark | Notes |
| --- | ---: | --- | --- | --- | --- | --- |
| `--line` | 271 | **Structure**, not a border | three tokens — see below | 17.10 | **1.28** | The largest single decision in the migration |
| `--outline-variant` | 41 | List / row divider | `colorNeutralStroke2` | 1.70 | 1.75 | Below 3:1, acceptable for decorative rules |
| `--outline` | 19 | Disabled-state border | `colorNeutralStrokeDisabled` | 4.47 | 5.18 | Clean match |

#### Splitting `--line`

One token does three different jobs across 271 call sites, and Fluent has a
distinct alias for each:

| Job | Example | Fluent 2 |
| --- | --- | --- |
| Divider between rows | `divide-line`, table rows | `colorNeutralStroke2` |
| Border of a control | inputs, buttons, icon buttons | `colorNeutralStroke1` |
| Emphasis / structure | card frames, section rules | `colorNeutralStrokeAccessible` |

Every call site has to be assigned by hand. There is no rule that separates
them mechanically, which makes this the review-heaviest item in Phase 3.

There is also a live defect here: in dark mode `--line` is `#000000` on a
`#1e201e` card — **1.28:1**, effectively invisible. The dark theme already does
not rely on the stroke the way the light theme does, so the light theme is the
one that changes most under Fluent.

### Brand

| Token | Uses | Means | Fluent 2 | Light | Dark | Notes |
| --- | ---: | --- | --- | --- | --- | --- |
| `--primary-container` | 54 | Brand fill **and** active-nav marker | two roles — see below | `#ff6b35` | `#ff6b35` | Identical in both themes by design |
| `--on-primary-container` | 47 | Text on brand fill | `colorNeutralForegroundOnBrand` | 4.56 | 4.56 | **Inverts** dark→white; must move together |
| `--primary` | 33 | Brand text and icons | `colorBrandForeground1` | 6.48 | 9.64 | Clean match |
| `--primary-fixed` | 5 | Soft brand tint | `colorBrandBackground2` | `#ffdbd0` | **none** | See the defect below |

Two problems, both quantified:

**The fill cannot stay `#ff6b35`.** Fluent puts
`colorNeutralForegroundOnBrand` — white — on `colorBrandBackground`. White on
`#ff6b35` measures **2.84:1** and fails. White on `#ab3500` measures
**6.48:1** and passes. The generated brand ramp has to place its base step near
`#ab3500`, with `#ff6b35` demoted to a lighter step used as a tint that never
carries text.

**Active navigation is not a brand fill.** Roughly a third of
`--primary-container` uses are the selected state of a nav item, tab or
toolbar link. Fluent expresses that as `colorNeutralBackground1Selected` plus a
brand indicator bar, not a saturated fill. Those call sites move to a different
token than the rest.

**`--primary-fixed` has no dark override.** It is declared once in `:root` and
never redefined, so all five call sites render the light tint `#ffdbd0` on a
dark ground. This predates the migration; it is recorded here and fixed in
Phase 3 rather than in a phase that is meant to be visually neutral.

### Status

| Token | Uses | Means | Fluent 2 | Light | Dark | Notes |
| --- | ---: | --- | --- | --- | --- | --- |
| `--error-container` | 25 | Error banner fill | `colorPaletteRedBackground1` | 7.24 | 7.24 | Pairs cleanly |
| `--on-error-container` | 22 | Text on that fill | `colorPaletteRedForeground1` | — | — | Pairs cleanly |
| `--error` | 13 | Error text / icon | `colorStatusDangerForeground1` | 6.46 | **4.36** | Dark just under AA |
| `--success` | 18 | Success fill under white text | `colorPaletteGreenBackground3` | — | — | 13 `text-white` sites become a token |
| `--warning` | 2 | Low-stock warning | `colorPaletteDarkOrangeForeground1` | 5.04 | 9.82 | Fluent's yellow risks failing on white; dark-orange is safer |

### Inverse and anchor

| Token | Uses | Means | Fluent 2 | Light | Dark | Notes |
| --- | ---: | --- | --- | --- | --- | --- |
| `--inverse-surface` | 11 | Dialog scrim (at `/70`) **and** avatar fill | `colorBackgroundOverlay` for the scrim | `#333027` | `#e2e3df` | Two unrelated jobs in one token |
| `--inverse-on-surface` | 7 | Text on the inverse fill | `colorNeutralForegroundInverted` | — | — | Clean match |
| `--anchor`, `--on-anchor`, `--on-anchor-variant` | 11 | Band that stays dark in **both** themes | **no equivalent** | 15.05 | 14.92 | See below |
| `--secondary-container`, `--on-secondary-container` | 5 | Neutral chip | `colorNeutralBackground4` | — | — | Low usage; fold into surfaces |
| `--tertiary-container`, `--on-tertiary-container` | 5 | Muted accent chip | `colorNeutralBackground5` | — | — | Low usage; fold into surfaces |

---

## Interaction states

The project has no state tokens at all. Every interactive treatment is written
by hand at the call site:

- hover — `hover:bg-surface-high`, repeated 79 times
- pressed — **does not exist anywhere**
- selected — a saturated brand fill, not a state token
- disabled — split between `disabled:*` utilities and raw `opacity`

Fluent ships a full set for every interactive surface, and Phase 3 imports it
whole rather than a colour at a time:

| State | Fluent alias |
| --- | --- |
| rest | `colorNeutralBackground1`, `colorSubtleBackground` |
| hover | `colorNeutralBackground1Hover`, `colorSubtleBackgroundHover` |
| pressed | `colorNeutralBackground1Pressed`, `colorSubtleBackgroundPressed` |
| selected | `colorNeutralBackground1Selected`, `colorSubtleBackgroundSelected` |
| disabled | `colorNeutralBackgroundDisabled`, `colorNeutralForegroundDisabled` |

Focus is the one state the project does have, and it is wrong: a single 2px
`--primary-container` ring, which disappears against the brand-filled controls
it most often surrounds. Fluent's two-tone indicator — `colorStrokeFocus1`
inner, `colorStrokeFocus2` outer — stays visible on any ground.

---

## Non-colour tokens

| Group | Today | Fluent 2 |
| --- | --- | --- |
| Radius | `0px` at every step, deliberately | `0 · 2 · 4 · 6 · 8 · circular` |
| Stroke width | 1px and 2px, ad hoc | `strokeWidthThin` … `Thickest` |
| Spacing | Tailwind's 4px scale | `2·4·6·8·10·12·16·20·24·32` |
| Elevation | `shadow-hard`, a solid offset with no blur | `shadow2` … `shadow64` |
| Motion | `duration-150` written by hand | `durationUltraFast` … `UltraSlow` + named curves |
| Type | 7 semantic steps | `Base100` … `Hero1000`, 10 steps with paired line heights |
| Breakpoints | Tailwind `sm`/`md`/`lg`/`xl` | **none — Fluent has no breakpoint tokens** |

Type mapping, names kept and re-pointed:

| Today | Fluent step |
| --- | --- |
| `text-display-lg` | `Hero900` · 40/52 |
| `text-headline-lg` | `Base600` · 24/32 |
| `text-headline-md` | `Base500` · 20/28 |
| `text-body-lg` | `Base400` · 16/22 |
| `text-body-md` | `Base300` · 14/20 |
| `text-label-md` | `Base200` · 12/16 |
| `text-label-sm` | `Base100` · 10/14 |

`label-mono` (46 files) is re-defined rather than deleted: `Base200` semibold
without `text-transform: uppercase`. Forced capitals do nothing to Arabic text,
and Fluent does not use them.

---

## No Fluent equivalent

Recorded deliberately. These stay as project-owned tokens.

| Token | Why nothing in Fluent fits |
| --- | --- |
| `--anchor`, `--on-anchor`, `--on-anchor-variant` | A band that stays dark in **both** themes. `colorNeutralBackgroundInverted` flips with the theme, so it would turn light in dark mode — the opposite of the intent. |
| `[data-numeric]` | Gives figures a mono face inside Arabic copy. `fontFamilyNumeric` exists but is a Latin face; the decision stays ours. |
| Book-cover palette | Eight fixed colours for printed objects that must not invert with the UI. Kept, but re-derived from the generated brand ramp in Phase 6. |
| Breakpoints | Fluent 2 publishes no breakpoint tokens. Tailwind's scale stays; Fluent's *density* idea (small / medium / large) is what gets adopted instead. |
| `--hard-dir` | Flips the offset shadow in RTL. Fluent's shadows are symmetric, so this is **deleted** in Phase 3, not mapped. |

---

## Defects found while auditing

None of these were introduced by the migration. They are recorded so a later
phase is not blamed for them, and so their fixes are deliberate.

| # | Defect | Measured |
| --- | --- | --- |
| 1 | `--line` is invisible in dark mode | `#000000` on `#1e201e` — **1.28:1** |
| 2 | `--muted` on a hover background fails AA | **4.20:1**, needs 4.5 |
| 3 | `--primary-fixed` has no dark override | 5 call sites render a light tint on a dark ground |
| 4 | `--error` in dark is just under AA | **4.36:1** |
| 5 | Author line on book covers fails AA | `opacity-80` at 10px drops 3 of 8 palettes below 4.5 — from the Phase 1 accessibility baseline |
| 6 | Focus ring vanishes on brand-filled controls | single-colour ring in the same hue as the fill |

Items 1–4 are addressed by the Phase 3 bridge, 5 in Phase 6, 6 in Phase 3 with
the two-tone focus indicator.

---

## What Phase 3 changed

The audit warned that `--primary-container` and `--on-primary-container` had to
move together or break. That was right, and incomplete: **three more tokens
turned out to serve two roles at once**, and each one broke when the single
value moved. The accessibility baseline caught all three — violations jumped
from 120 nodes to 316 before they were found.

| Token | Second role the audit missed | Split into | Measured |
| --- | --- | --- | --- |
| `--primary-container` | brand **text** on the anchor band, in the footer | `--on-anchor-brand`, pinned to ramp step 110 | 2.64 → 6.36 |
| `--primary-fixed` | paired with `--on-primary-container` (now white) on a light tint | `--on-primary-fixed` | **1.11** → 5.83 |
| `--success` | a text colour in 3 places as well as a fill in 10 | `--success-fg` | failed in dark → passes |

The lesson generalises: a token that is used as both a background and a
foreground cannot survive a palette change intact, because the two roles move
in opposite directions. Any remaining token with that shape should be split
before Phase 4 touches it, not after.

Also settled in Phase 3:

- **`--primary-fixed` now has a dark value.** It inherits one from the Fluent
  layer instead of falling through to the light tint. Defect 3 is closed.
- **`--hard-dir` is gone.** Fluent's shadows are symmetric, so the RTL flip had
  nothing left to do.
- **`prefers-reduced-motion` is honoured**, which it never was before.
- **The focus ring is two-tone**, so it no longer disappears on brand fills.

One item did **not** land, and it is worth being plain about: the radius scale
is defined and correct, but **nothing in the app consumes it**. The old design
was deliberately square, so not one component ever wrote `rounded-*` — and
Tailwind only emits utilities it finds in the source. Radius becomes visible in
Phase 4, when the primitives start asking for it. The token layer cannot
retrofit it on its own.

---

## What Phase 4 changed

The primitives in `components/ui/` now carry Fluent's appearances, sizes and
states. Radius finally landed — it had nowhere to attach until a component
asked for it.

| Primitive | Now |
| --- | --- |
| `Button` | Five Fluent appearances (`ghost` kept as an alias for `subtle`), the 24 / 32 / 40 ramp, colour-only hover and pressed states instead of a lift |
| `IconButton` | Same appearances and ramp, square |
| `Input` / `Textarea` / `Select` | Fluent's `outline` field: 4px radius, a darker bottom rule that becomes a 2px accent bar on focus. Still native elements — eight of nine `Select` call sites are Server Components |
| `Checkbox` / `RadioCard` | Fluent marks, drawn with inset shadows so the controls stay native |
| `Field` | Required marker, semibold label, Base200 hint |
| `Surface` + `SurfaceHeader` | New. Fluent's four Card appearances, for the 23 framed containers the classification found |
| `List` + `ListRow` | New. For the 7 list-item usages |
| `Badge` / `StatusBadge` | 20px, tinted background with a matching foreground rather than a saturated fill under white |

### One bug worth remembering

The primary button rendered **dark text on the brand fill** — `#242424` on
`#ab3500`. The cause was not the token layer: `tailwind-merge` saw
`text-on-primary-container` and `text-body-lg` as two `text-*` classes,
called them a conflict, and dropped the colour. Any semantic colour name
colliding with a semantic font-size name would have done the same.

Fixed at the root in `lib/utils.ts` by naming the seven font-size steps
explicitly, so everything else after `text-` is treated as a colour. Worth
knowing before adding any further `text-*` token.

### Accessibility

**Violations went from 118 to zero**, across all 104 scans.

Three fixes got there. Two were regressions this phase introduced — the
button foreground above, and the auth watermark, which became white at 20%
opacity on the brand fill and measured 1.47:1. The watermark is now generated
content rather than a text node: it is decoration, and raising its opacity to
the 3:1 it would have needed turns a watermark into a headline.

The third was the long-standing book-cover defect. It was assigned to Phase 6,
but it was the only violation left in the entire suite and the fix was one
class — `opacity-80` on a 10px line, which dropped three of eight palettes to
3.33, 4.30 and 4.34. Pulled forward rather than left standing.

---

## What Phase 5 changed

Fluent UI React v9 now runs inside the app, confined to the client islands that
already existed. `FluentShell` is the single boundary — the root layout passes
`children` straight through it, so **all 56 pages and every layout are still
Server Components**.

| Island | Now | What it gains |
| --- | --- | --- |
| `Modal` (+ `ConfirmDialog`) | Fluent `Dialog` | Focus trap, inert background, correct `aria-modal` wiring |
| `Drawer` | Fluent `OverlayDrawer` | One component replacing three hand-rolled copies |
| `Toast` | Fluent `Toaster` | Queue, pause on hover and window blur, intent-driven politeness |
| `Tabs` | Fluent `TabList` | Roving tabindex — arrow keys did nothing before |
| `AccountMenu` | Fluent `Menu` | Arrow-key navigation, typeahead, focus return |

`useToast()` and `Modal`'s props are unchanged, so the fourteen toast callers
and every `ConfirmDialog` consumer were untouched.

### Focus restoration had to be written

Fluent restores focus by itself only when an overlay is opened through a
`DialogTrigger`. Both overlays here are controlled by an `open` prop with the
trigger outside, so focus landed on `<body>` — a keyboard user closing a drawer
was dropped at the top of the page.

The obvious fix does not work: capturing the active element in an effect keyed
on `open` runs *after* Fluent has already moved focus inside, so it captures an
element that is about to unmount. `useRestoreFocus` instead records the last
focus that landed **outside any floating layer**, which is correct regardless
of effect ordering. Verified end to end: trap in, `Esc` closes, focus returns
to the trigger.

### The accessibility gate caught Fluent itself

Violations went 0 → 200, all `aria-hidden-focus`, and none of it was our code:
Tabster puts two sentinels on every page —
`<i tabindex="0" role="none" aria-hidden="true" data-tabster-dummy>`.

Before excluding them, the claim was tested: focusing either sentinel redirects
to a real link within a frame, so neither is ever a resting focus target and
the harm the rule guards against cannot occur. They are excluded in
`tests/a11y/axe.spec.ts` with that reasoning recorded, and the gate is back to
**zero**.

### Two predictions the plan got wrong

**Client-component count went up, not down.** The plan expected 45 → 43 because
one drawer would replace three. In practice the three call sites still need
their own components — each has a distinct trigger and distinct content — so
what collapsed was the duplicated overlay logic, not the files. With
`FluentShell` and the shared `Drawer` added, the count is **45 → 47**. The rule
as written is broken by two; its intent holds, since no page or layout became
a client component.

**The bundle cost more than the spike suggested.** Phase 0 measured +68 KB gzip
for `Button` + `Dialog` + `TabList`. The real figure for the full island set is
**400.2 → 528.4 KB gzip, +128.2 KB (+32%)** — Griffel, Tabster and the
component set together. That buys the focus management, keyboard navigation and
overlay behaviour listed above, none of which existed before. Whether it is
worth 128 KB on a storefront is a product decision, not a technical one, and it
should be taken deliberately rather than inherited.

---

## What Phase 6 changed

49 storefront files moved onto the token layer: Fluent radii on every frame,
`--line` finally split at the call site (section rules and row dividers became
`--line-divider`, control borders stayed `--line`), hand-written hovers
replaced by `--state-hover`, and `duration-150` replaced by the motion tokens.

Four decisions were settled rather than swept:

**The five interactive cards get Fluent's treatment, not a lift.** The shadow
deepens and the background shifts on hover; the `-translate-y-1` that was the
old system's signature is gone.

**No `Card` abstraction.** This was left open in Phase 2 pending a look at the
real usage. The five cards share only `rounded-md border border-line bg-card`
plus a hover rule — two lines. Their interiors have nothing in common: the book
card is cover-over-meta-over-price, the author card is centred, the publisher
card is a list. An abstraction over two lines of shared class would be
ceremony, so each keeps its own markup.

**The cover palette is derived.** The eight hard-coded hexes now come from
`noqtaBrand`, spanning step 10 to step 150. They stay theme-independent because
covers are printed objects, and every pair clears 4.5:1 at full strength —
5.83 at the tightest.

**The selected-nav pattern is Fluent's.** A subtle background plus a brand bar
on the leading edge, instead of a saturated fill.

### A correction to the Phase 2 classification

`ListRow` was sized for seven usages. On inspection only two or three are
actually divided rows inside a shared frame — the cart lines and the static
content pages. The rest are standalone framed blocks that happen to be `<li>`,
which makes them `Surface` cases.

Neither `Surface` nor `ListRow` has been adopted at the call sites. The
mechanical sweep already produced the right visual result, so adoption is a
maintainability refactor with no user-visible effect, and starting a
23-file markup change late in the phase would have meant re-reviewing every
screenshot for no gain. It is better done as its own pass, with the corrected
counts above.

---

## What Phase 7 changed

26 admin files swept onto the token layer, plus four pieces of real work:

**Tables carry Fluent's density.** Row heights are named on the table
(`compact` 32px, `default` 44px) instead of whatever padding each call site
happened to write, headers sit on `colorNeutralBackground3`, and rows divide
with `--line-divider`.

**`Panel` became a `Surface`.** This is where the Phase 4 primitive finally
earns its keep: the admin's building block had its own copy of the frame and
header markup, and both now live in one place.

**Charts speak to screen readers.** Each one renders its series as a visually
hidden table — the numbers, not a summary — with the drawing marked
`aria-hidden` so nothing is announced twice. The caption comes from the panel
that already titles the chart, so the hidden table is labelled with the same
words a sighted reader sees. Each also has an empty state, which none had.

**`admin-notifications` is on Fluent's `Popover`** — the last hand-rolled
floating layer in the app. Its own outside-click and escape listeners are gone.

`admin-nav` and `table-toolbar` now use the same selected pattern as the
storefront: subtle background plus a brand bar, not a saturated fill.

### Sortable headers — the one approved data-layer change

Sorting was paused at the red line and built after explicit approval. It is the
only change to `src/data/index.ts` in the whole migration.

`AdminListQuery` gained a `sort?: string`, and four list functions —
`getAdminBooks`, `getAdminOrders`, `getCustomers`, `getAdminReviews` — now
resolve it through a per-entity map. `getCustomers` had **no ordering at all**
before and picked up a stable `createdAt: "desc"` default as a side effect.

The key arrives from a query string, so it is never handed to Prisma directly:

```ts
return key && Object.hasOwn(map, key) ? map[key] : fallback;
```

`Object.hasOwn` rather than a plain lookup — `?sort=constructor` would
otherwise reach `Object.prototype` and pass Prisma something that is not an
ordering. Verified against `constructor`, `toString` and `__proto__`; all three
fall back.

The view side needed nothing new from `lib/search-params.ts`. `SortableTh`
renders a **link**, not a button, so a sorted table stays a shareable URL and
the page stays a Server Component, and it sets `aria-sort` — which these tables
could not have had before, since they did not sort. Nine sortable columns
across four tables, with `sort` carried through every filter tab and pagination
link so it survives them.

### What could not be verified

The admin panel sits behind authentication, so **none of this phase is covered
by the visual or accessibility suites** — those pages are the documented gap
from Phase 1. What was verified: types, lint, a production build, the
functional contract, and that all 156 public screenshots still match exactly,
which rules out the admin sweep leaking through shared components.

To bring the admin pages under the suites, sign in once and save a session:

```
npx playwright open --save-storage=tests/.auth/user.json http://localhost:3000/ar/login
```

---

## Where the migration stands

Seven phases in, the app runs on Fluent 2 end to end: generated tokens under
Tailwind for the RSC half, Fluent React v9 in the client islands, one brand
ramp feeding both.

**Measured:** zero accessibility violations across 104 scans, down from 120 at
the Phase 1 baseline. 156 visual baselines. The functional contract has been
green in every phase. All 56 pages and every layout are still Server
Components.

### Closing pass

The leftovers from the phase plan were cleared afterwards:

- `ghost` is gone from `Button` and `IconButton`; the six call sites moved to
  Fluent's own name, `subtle`. Two of the six were found by the type checker
  rather than by grep — they were written `variant: "ghost"` inside a
  `buttonStyles({...})` call, which is exactly why deleting an alias is worth
  more than leaving it.
- The `shadow-hard` compatibility utilities were removed. They had no call
  sites left.
- `--scrim` was removed. It was created in Phase 3 and never used once —
  Fluent's `Dialog` and `Drawer` draw their own backdrop.
- The last two hand-written `duration-150` values moved to the motion tokens.
- `AGENTS.md` now documents the three token layers, the RSC boundary, and the
  three traps that cost the most time here: the tailwind-merge font-size
  configuration, Griffel's ban on CSS shorthands, and why the font variables
  have to sit on `<html>`.
- The accessibility scan runs on all six viewport/theme projects. Tablet was
  previously left out; it is clean too.

One thing was **not** finished, and the comment in `globals.css` now says so
plainly rather than promising a later phase: the `--line` split is partial.
261 call sites still say `border-line`, 60 moved to `--line-divider`, and
`--line-strong` has 4. Separating a divider from a control border needs each
site read, and doing it in bulk would have been guesswork.

---

**Two things are open, and neither is a loose end — each is a decision rather
than an omission:**

1. **+128 KB gzip.** 400.2 → 528.4 KB for the Fluent islands. It buys focus
   trapping, focus restoration, arrow-key navigation and overlay management
   that were absent. Whether a storefront should pay it is a product call. The
   lever, if not: scope `FluentProvider` to the islands and drop `TabList`,
   which is the cheapest to hand-roll. `Dialog` and `Drawer` are not.

2. **`Surface` and `ListRow` adoption.** ~23 and ~2–3 sites. Pure
   maintainability — the visual result is already correct — so it is best done
   as its own pass rather than bolted onto a phase. *Done for the storefront;
   see "The adoption pass" below for what is left and why.*

**And one gap that is not a decision:** the admin panel and the account pages
have no visual or accessibility coverage, because the suite will not create an
account or type a password. A saved session closes it in one command. *The
public half of that gap is now closed — six layouts that were never captured
are in the baseline. The gated half still needs the one command.*

---

## The paper pass — neutrals leave Fluent, everything else stays

The reference design the storefront was re-cut against is a printed-paper
bookshop: cream ground, beige bands, rounded corners, diffuse warm shadows,
a serif display face. Fluent's neutral ramp is built for Office chrome and is
strictly grey, so the neutrals had to be replaced.

They live in **`src/theme/noqta-paper.ts`**, beside the brand ramp and with
the same shape: plain data, no imports, two consumers. The generator folds
them into the emitted theme (`withPaper`), and `FluentShell` folds the same
values into the runtime theme, so the aliases in `globals.css` still point at
Fluent token names and **the islands are painted from the same values as the
page behind them**.

Doing it any other way was tried first and was wrong: with the ramp written
straight into `globals.css`, the Tailwind layer went warm and the Fluent layer
did not. In dark mode a dialog opened at Fluent's grey `#292929` on top of a
brown `#211c16` page. That is the whole reason the ramp is a TypeScript module
and not a block of CSS.

Only the tokens the design actually paints with are replaced — 22 of the 125
neutrals. The rest keep Fluent's values because nothing reads them.
`npm run tokens:check` is unchanged and still passes at 459 tokens.

### The ramp

| Step | Light | Dark | Role |
| --- | --- | --- | --- |
| `--paper-0` | `#ffffff` | `#211c16` | cards |
| `--paper-50` | `#fdfbf6` | `#16130f` | the page |
| `--paper-100` | `#f8f4e9` | `#1c1811` | banded sections, footer |
| `--paper-150` | `#f2ecdd` | `#2a241c` | hover |
| `--paper-200` | `#eae2ce` | `#332c22` | pressed, dividers |
| `--paper-300` | `#e2d8c0` | `#3a3227` | hairlines |
| `--paper-400` | `#cfc2a4` | `#6a5e4a` | control strokes |
| `--ink-900` | `#221e17` | `#f2ece0` | body text |
| `--ink-600` | `#5a5348` | `#cdc4b4` | secondary text |
| `--ink-400` | `#6f6658` | `#a2988a` | muted text |

The ramp is declared once per theme in the module and reaches CSS through the
generated file, so nothing is repeated by hand. Measured on the light page:
`--ink-900` 15.4:1, `--ink-600` 7.35:1, `--ink-400` 5.46:1 — and 6.74:1 and
5.01:1 respectively on the beige band, which is the tighter of the two grounds
and the one that decided `--ink-400`. A first cut at `#857c6d` measured 3.98:1
there and was rejected.

### Three changes that touch every call site at once

**Radii shift up one Fluent step.** `--radius-md` lands on
`borderRadiusXLarge` (8px) instead of `borderRadiusMedium` (4px), and
`lg`/`xl`/`2xl` follow to 12/16/24. The names are unchanged, so all 102
`rounded-md` call sites round themselves. The values are still Fluent's own
steps.

**Elevation is warm.** Fluent's shadows are neutral black at a tight radius;
over cream that reads as grime rather than lift. The four `elevation-*`
utilities keep Fluent's symmetric, direction-free shape — there is still
nothing to flip in RTL — but spread further and tint brown through
`--shade-soft` / `--shade-key`.

**There is no monospace any more.** The reference has none, prices included.
`--font-mono` is kept as a name because 30-odd call sites and the `label-mono`
utility say it, but it resolves to the sans stack; `[data-numeric]` keeps
`font-feature-settings: "tnum"`, so cart columns and invoices still align.
JetBrains Mono is no longer downloaded, which pays for one of the two serif
faces the display stack added — Playfair Display for Latin, Noto Naskh Arabic
for Arabic, resolved per glyph. The webfont count is unchanged at three.

### One token added, and one heading rule

`--gold` / `--gold-fg`, from Fluent's Marigold palette. Star ratings were
drawn in the brand orange, which made the rating compete with the call to
action on every card. Amber is what the reference uses and it is a hue Fluent
already ships, so it is borrowed rather than invented.

The display serif is scoped to `h1` and `h2`. The reference sets page titles
and section headings in its serif and everything below in the running face; a
shelf of ten serif card titles competes with the heading above it. Anything at
`h3` that wants the serif asks for `font-display` at the call site — the book
jacket placeholder does.

---

## The adoption pass — the storefront's panels stop being hand-written

`Surface` was written in Phase 3 and the admin adopted it immediately, through
`Panel`. The storefront never did: it kept writing
`rounded-xl border border-line bg-card` at 38 call sites and
`border-b border-line px-5 py-4 text-headline-md` at eight more, once per
panel that has a title.

That is now down to 28 and zero.

### What moved, and what deliberately did not

| Family | Sites | Moved to |
| --- | --- | --- |
| Titled panel frame | 10 | `Surface` |
| Panel title | 8 | `surfaceTitleStyles()` |
| Tinted aside | 5 | `Surface appearance="filled-alternative"` |
| Framed divided list | 2 | `List` |

What stayed hand-written, and why:

- **The primitives themselves** — `EmptyState`, `RadioCard`, `Accordion`,
  `DataTable`, the skeletons. They *are* the frame; wrapping a primitive in a
  primitive buys nothing.
- **The three interactive entity cards** — the category tile, the category
  card and the publisher card. Each carries a bespoke hover treatment that is
  not `Surface`'s (`hover:border-line-hover` on one, `hover:bg-card-hover` on
  another), and folding them into `interactive` would either change what they
  do on hover or add a third appearance for two call sites.
- **Three `<form>` elements.** `Surface` renders a tag, not a form: it has no
  `action` or `method`. Giving it arbitrary props to reach three sites is a
  worse trade than three literal strings.
- **The account and admin frames.** Not a judgement — those pages have no
  screenshot, so a change there cannot be shown to be invisible. They are the
  first thing to finish once a session exists.

### Why `surfaceTitleStyles` and not `SurfaceHeader`

`SurfaceHeader` already existed and was the obvious answer, and it was the
wrong one. It is the *admin's* header: `px-4 py-3`, `text-body-lg`
semibold, divided with `--line-divider`, and wrapped in a flex row that carries
a subtitle and an action. The storefront's is `px-5 py-4`, `text-headline-md`,
divided with `--line`, and carries a heading and nothing else.

Those are not an inconsistency to reconcile — they are two densities, and the
admin is meant to be the dense one. So the storefront got the styles rather
than the component, in the shape `buttonStyles` already established here, and
the heading level stays at the call site: a page's own panels are `h2`, a panel
nested under one is `h3`.

### How it was verified

The pass is meant to be invisible, so "invisible" had to be measurable rather
than asserted.

Every call site was first run through the app's own `cn()` before it was
touched, comparing the string it renders today against the string the
primitive would render. Across all 12 frame swaps the difference was one class:
`min-w-0`, which `Surface` adds by design, plus `overflow-hidden` on the two
lists. Nothing was dropped and nothing else was added — which matters, because
`cn()` is tailwind-merge, and tailwind-merge silently drops what it thinks
conflicts. That check is what makes the swap on the four pages behind a login
defensible rather than hopeful.

Then the suite: 228 screenshots and 228 accessibility scans, all unchanged.

`min-w-0` is a no-op on a block child and only bites on a flex or grid item,
where it stops the item refusing to shrink below its content. Two of the sites
are grid items — the contact form panel and the order items panel — and that
is the behaviour this codebase wants there anyway: a grid column holding a
table needs `min-w-0` or it overflows horizontally on mobile.
