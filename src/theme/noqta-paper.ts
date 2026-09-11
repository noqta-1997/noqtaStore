/**
 * Noqta's neutral ramp — a cool grey carrying a faint blue cast.
 *
 * Plain data with no imports, for the same reason `noqta-brand.ts` is: two
 * very different consumers read it. The build-time token generator folds it
 * into the emitted CSS, and `FluentShell` folds it into the runtime theme the
 * islands are painted with. One source is what stops a dialog from opening on
 * a different grey than the page under it.
 *
 * The cast is what separates this from Fluent's own neutrals, which are dead
 * grey. A few points of blue in the surfaces is most of what reads as calm in
 * the dashboards this was cut from.
 *
 * `paper50` is deliberately a step darker than a near-white page would be.
 * The reference gets its depth from the ground being clearly darker than the
 * sheets on it — cards at `paper0` read as floating without needing a shadow,
 * which is what lets the whole design run on hairlines. Pulled too close to
 * white and the cards vanish into the page; that was the first thing this
 * ramp got wrong.
 *
 * Fluent's neutrals are computed from a fixed grey ramp inside
 * `createLightTheme` / `createDarkTheme` and are not parameterised the way the
 * brand ramp is, so they are replaced afterwards rather than passed in. Only
 * the tokens the design actually paints with are replaced; the rest of
 * Fluent's neutrals stay as generated, because nothing reads them.
 *
 * Contrast, measured on the light page (`paper50`) and the band (`paper100`):
 * ink900 14.6:1 / 13.5:1, ink600 6.85:1 / 6.36:1, ink400 5.20:1 / 4.83:1.
 */

export interface PaperRamp {
  /** Cards — the sheet on top of the page. */
  paper0: string;
  /** The page itself. */
  paper50: string;
  /** Banded sections and the footer. */
  paper100: string;
  /** Hover. */
  paper150: string;
  /** Pressed, selected, dividers. */
  paper200: string;
  /** Hairlines. */
  paper300: string;
  /** Control strokes. */
  paper400: string;

  /** Body text. */
  ink900: string;
  /** Secondary text. */
  ink600: string;
  /** Muted text. */
  ink400: string;
}

export const noqtaPaperLight: PaperRamp = {
  paper0: "#ffffff",
  paper50: "#eff1f6",
  paper100: "#e5e9f0",
  paper150: "#dce1ea",
  paper200: "#d2d8e3",
  paper300: "#c8cfdc",
  paper400: "#a2abbd",

  ink900: "#1a1f2b",
  ink600: "#4a5364",
  ink400: "#5c6575",
};

/** The same surfaces under a lamp: hues stay cool, lightness inverts. */
export const noqtaPaperDark: PaperRamp = {
  paper0: "#1c2029",
  paper50: "#11141b",
  paper100: "#161a22",
  paper150: "#232833",
  paper200: "#2c313d",
  paper300: "#333945",
  paper400: "#5d6575",

  ink900: "#e8eaf0",
  ink600: "#b4bac6",
  ink400: "#8d94a3",
};

/**
 * Which Fluent token each step answers to.
 *
 * These are the same pairings `globals.css` already made by hand when the
 * aliases pointed straight at Fluent — `--card` at `colorNeutralBackground1`,
 * `--surface` at `2`, the band at `3`. Moving them here means the islands
 * inherit the mapping instead of only the Tailwind layer having it.
 */
export function paperOverrides(ramp: PaperRamp): Record<string, string> {
  return {
    colorNeutralBackground1: ramp.paper0,
    colorNeutralBackground1Hover: ramp.paper50,
    colorNeutralBackground1Pressed: ramp.paper100,
    colorNeutralBackground1Selected: ramp.paper100,
    colorNeutralBackground2: ramp.paper50,
    colorNeutralBackground3: ramp.paper100,
    colorNeutralBackground4: ramp.paper100,
    colorNeutralBackground5: ramp.paper200,
    colorNeutralBackgroundDisabled: ramp.paper100,

    colorNeutralForeground1: ramp.ink900,
    colorNeutralForeground2: ramp.ink600,
    colorNeutralForeground3: ramp.ink400,

    colorNeutralStroke1: ramp.paper300,
    colorNeutralStroke1Hover: ramp.paper400,
    colorNeutralStroke1Pressed: ramp.paper400,
    colorNeutralStroke2: ramp.paper200,
    colorNeutralStrokeAccessible: ramp.paper400,
    colorNeutralStrokeDisabled: ramp.paper300,
    colorNeutralStrokeSubtle: ramp.paper200,

    colorSubtleBackgroundHover: ramp.paper150,
    colorSubtleBackgroundPressed: ramp.paper200,
    colorSubtleBackgroundSelected: ramp.paper200,
  };
}

/** Returns a copy of `theme` with the paper neutrals folded in. */
export function withPaper<T extends Record<string, unknown>>(
  theme: T,
  ramp: PaperRamp,
): T {
  return { ...theme, ...paperOverrides(ramp) };
}
