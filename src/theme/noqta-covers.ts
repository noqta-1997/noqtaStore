/**
 * The jackets drawn for books that have no cover image yet.
 *
 * Plain data with no imports, like the other two ramps, because these values
 * are read at render time and must not move.
 *
 * **Fixed in both themes on purpose.** A cover is a printed object: a green
 * book is green under a lamp and green in daylight. So these are literal
 * hexes rather than theme-aware tokens, which is also why they cannot come
 * from `globals.css` — every alias there inverts with the theme.
 *
 * **Where the colours come from.** Ten of the twelve are Fluent's own
 * `<Hue>Background2` / `<Hue>Foreground2` pairs, which Microsoft ships as
 * matched sets; the remaining two are Noqta's brand ramp, kept so a shelf
 * still says whose shop it is. Nothing here was picked by eye — deriving the
 * whole set from the brand ramp was the previous approach, and it made every
 * shelf in the store one shade of the brand.
 *
 * The two brand jackets follow the ramp when it moves. They were the orange
 * `#ab3500` / `#fbd9ce` pair; the recut re-anchored them on the indigo, and
 * their contrasts were re-measured rather than assumed — the ink jacket came
 * out at 4.67, which clears the small-text bar but by less than the orange
 * did, so it is the one to re-check first if the ramp is ever re-tuned.
 *
 * **The contract.** Both lines of type on a jacket sit directly on its
 * background, and the author line is 10px, which is small text: the pair has
 * to clear 4.5:1 on its own, with no opacity applied on top. Measured:
 * 5.83 at the tightest and 10.34 at the widest. An earlier version dimmed the
 * author line to 80% and three pairs fell to 3.33, 4.30 and 4.34 — the only
 * accessibility violation in the whole suite. If you add a pair, measure it.
 */

export interface CoverPalette {
  /** The jacket. */
  background: string;
  /** Both the title and the author line. */
  foreground: string;
}

/**
 * Half dark and half light, alternating, so a grid of them reads like a
 * shelf rather than a swatch card. The order matters only in that the hash
 * walks it, so neighbouring slugs rarely land on the same kind twice.
 */
export const noqtaCovers: readonly CoverPalette[] = [
  { background: "#3b5bfd", foreground: "#f2f4ff" }, // brand, ink   — 4.67
  { background: "#e4e8ff", foreground: "#1c2c79" }, // brand, paper — 10.25
  { background: "#063b06", foreground: "#9ad29a" }, // forest       — 7.37
  { background: "#e0cea2", foreground: "#553e06" }, // brass        — 6.51
  { background: "#001665", foreground: "#a3b2e8" }, // navy         — 7.75
  { background: "#eeacb2", foreground: "#6e0811" }, // cranberry    — 6.55
  { background: "#43002b", foreground: "#d696c0" }, // plum         — 7.05
  { background: "#bdd99b", foreground: "#294903" }, // moss         — 6.62
  { background: "#50301a", foreground: "#ddc3b0" }, // leather      — 7.03
  { background: "#d2ccf8", foreground: "#3f3682" }, // lavender     — 6.66
  { background: "#00333f", foreground: "#94c8d4" }, // steel        — 7.42
  { background: "#a9d3f2", foreground: "#004377" }, // sky          — 6.42
] as const;
