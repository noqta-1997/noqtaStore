/**
 * Noqta's neutral ramp — warm paper instead of Fluent's grey.
 *
 * Plain data with no imports, for the same reason `noqta-brand.ts` is: two
 * very different consumers read it. The build-time token generator folds it
 * into the emitted CSS, and `FluentShell` folds it into the runtime theme the
 * islands are painted with. One source is what stops a dialog from opening in
 * cold grey on a cream page.
 *
 * Fluent's neutrals are computed from a fixed grey ramp inside
 * `createLightTheme` / `createDarkTheme` and are not parameterised the way the
 * brand ramp is, so they are replaced afterwards rather than passed in. Only
 * the tokens the design actually paints with are replaced; the rest of
 * Fluent's neutrals stay as generated, because nothing reads them.
 *
 * Contrast, measured on the light page (`paper50`) and the band (`paper100`):
 * ink900 15.4:1 / 14.1:1, ink600 7.35:1 / 6.74:1, ink400 5.46:1 / 5.01:1.
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
  paper50: "#fdfbf6",
  paper100: "#f8f4e9",
  paper150: "#f2ecdd",
  paper200: "#eae2ce",
  paper300: "#e2d8c0",
  paper400: "#cfc2a4",

  ink900: "#221e17",
  ink600: "#5a5348",
  ink400: "#6f6658",
};

/** The same paper under a lamp: hues stay warm, lightness inverts. */
export const noqtaPaperDark: PaperRamp = {
  paper0: "#211c16",
  paper50: "#16130f",
  paper100: "#1c1811",
  paper150: "#2a241c",
  paper200: "#332c22",
  paper300: "#3a3227",
  paper400: "#6a5e4a",

  ink900: "#f2ece0",
  ink600: "#cdc4b4",
  ink400: "#a2988a",
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
