/**
 * Noqta's brand ramp, in Fluent 2's 16-step shape.
 *
 * Plain data with no imports, because two very different consumers need it:
 * the build-time token generator (`scripts/generate-fluent-tokens.ts`) and,
 * from Phase 5, the runtime `FluentProvider`. Keeping the ramp dependency-free
 * is what stops those two from drifting apart.
 *
 * Step 80 is the load-bearing one — Fluent turns it into
 * `colorBrandBackground` and always puts white on it. That fixes the value:
 * white on the old `#ff6b35` measures 2.84:1 and fails, white on `#ab3500`
 * measures 6.48:1 and passes. So the vivid orange moves up the ramp to around
 * step 100, where it is used as a tint rather than as a text-bearing fill.
 *
 * The rest of the ramp keeps the lightness profile of Fluent's own reference
 * ramp — that profile is what makes the derived alias tokens land at usable
 * contrasts — re-anchored at step 80 and re-hued to Noqta's orange in OKLCH.
 */

/** Matches `BrandVariants` from `@fluentui/react-theme`. */
export interface BrandRamp {
  10: string; 20: string; 30: string; 40: string;
  50: string; 60: string; 70: string; 80: string;
  90: string; 100: string; 110: string; 120: string;
  130: string; 140: string; 150: string; 160: string;
}

export const noqtaBrand: BrandRamp = {
  10: "#1b0703",
  20: "#2d0e04",
  30: "#3f1406",
  40: "#521d0a",
  50: "#68230b",
  60: "#7d2a0c",
  70: "#922e04",
  80: "#ab3500", // colorBrandBackground — white on this is 6.48:1
  90: "#ce4e21",
  100: "#e86a41",
  110: "#ec805d",
  120: "#f19273",
  130: "#f6aa91",
  140: "#f9c3b1",
  150: "#fbd9ce",
  160: "#fef0ec",
};
