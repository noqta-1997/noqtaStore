/**
 * Noqta's brand ramp, in Fluent 2's 16-step shape.
 *
 * Plain data with no imports, because two very different consumers need it:
 * the build-time token generator (`scripts/generate-fluent-tokens.ts`) and,
 * from Phase 5, the runtime `FluentProvider`. Keeping the ramp dependency-free
 * is what stops those two from drifting apart.
 *
 * Step 80 is the load-bearing one — Fluent turns it into
 * `colorBrandBackground` and always puts white on it, which fixes the value:
 * white on `#3b5bfd` measures 5.12:1 and passes. The vivid tints live from
 * step 90 up, where they are used as fills behind dark text rather than as
 * text-bearing backgrounds.
 *
 * The rest of the ramp keeps the lightness profile of Fluent's own reference
 * ramp — that profile is what makes the derived alias tokens land at usable
 * contrasts — re-anchored at step 80 and re-hued to the indigo.
 *
 * It was Noqta's orange (`#ab3500`) until the store was recut on a neutral
 * dashboard reference. The ramp shape did not change; only the hue did, which
 * is the whole reason the ramp is a separate file from the tokens it feeds.
 */

/** Matches `BrandVariants` from `@fluentui/react-theme`. */
export interface BrandRamp {
  10: string; 20: string; 30: string; 40: string;
  50: string; 60: string; 70: string; 80: string;
  90: string; 100: string; 110: string; 120: string;
  130: string; 140: string; 150: string; 160: string;
}

export const noqtaBrand: BrandRamp = {
  10: "#090f28",
  20: "#101944",
  30: "#162360",
  40: "#1c2c79",
  50: "#24389a",
  60: "#2b42b9",
  70: "#324dd7",
  80: "#3b5bfd", // colorBrandBackground — white on this is 5.12:1
  90: "#5a75ff",
  100: "#7a8fff",
  110: "#94a4ff",
  120: "#a9b5ff",
  130: "#c0c8ff",
  140: "#d3d9ff",
  150: "#e4e8ff",
  160: "#f2f4ff",
};
