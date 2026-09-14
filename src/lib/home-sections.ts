import type { Dictionary } from "@/i18n/get-dictionary";

/**
 * The home page's sections, in the order they appear on it.
 *
 * The page, the settings tab that switches them off, and the action that
 * writes the switch all read this one list, so a section added to the page
 * shows up in the panel by being added here — and a name posted from a
 * crafted form that is not in it is refused rather than stored.
 */
export const HOME_SECTIONS = [
  "hero",
  "features",
  "bestsellers",
  "categories",
  "promo",
  "newArrivals",
  "authors",
  "newsletter",
] as const;

export type HomeSection = (typeof HOME_SECTIONS)[number];

export type HomeSectionVisibility = Record<HomeSection, boolean>;

export function isHomeSection(value: string): value is HomeSection {
  return (HOME_SECTIONS as readonly string[]).includes(value);
}

/** The `store_settings` row a section's switch is kept in. */
export function homeSectionKey(section: HomeSection): string {
  return `home.${section}`;
}

/** A section is on until the panel has turned it off. */
export function homeVisibility(
  settings: Record<string, string>,
): HomeSectionVisibility {
  return Object.fromEntries(
    HOME_SECTIONS.map((section) => [
      section,
      settings[homeSectionKey(section)] !== "false",
    ]),
  ) as HomeSectionVisibility;
}

/* ------------------------------------------------------------------ */
/* Copy                                                                */
/* ------------------------------------------------------------------ */

/**
 * The copy the panel can rewrite, section by section, as paths into
 * `dictionary.home.<section>`.
 *
 * The dictionary stays the default: a saved row `home.<section>.<path>`
 * replaces that one string and an empty field deletes the row, so a section
 * nobody has edited reads exactly as it did before the panel could touch it.
 */
export const HOME_TEXT_FIELDS = {
  hero: [
    "featuredLabel",
    "title",
    "titleHighlight",
    "subtitle",
    "primaryCta",
    "secondaryCta",
  ],
  features: [
    "shipping.title",
    "shipping.description",
    "payment.title",
    "payment.description",
    "authentic.title",
    "authentic.description",
    "returns.title",
    "returns.description",
  ],
  bestsellers: [],
  categories: [],
  promo: [],
  newArrivals: [],
  authors: [],
  newsletter: [],
} as const satisfies Record<HomeSection, readonly string[]>;

/** The `store_settings` row one rewritten string is kept in. */
export function homeTextKey(section: HomeSection, path: string): string {
  return `home.${section}.${path}`;
}

/** The dictionary's own string for one field — what an empty field falls back to. */
export function homeTextDefault(
  home: Dictionary["home"],
  section: HomeSection,
  path: string,
): string {
  let node: unknown = home[section];
  for (const step of path.split(".")) {
    node = (node as Record<string, unknown>)[step];
  }
  return typeof node === "string" ? node : "";
}

/**
 * The home copy with the panel's rewrites laid over it.
 *
 * Returns a new object shaped exactly like `dictionary.home`, so the section
 * components keep reading `dictionary.home.<section>` and do not know
 * whether a string came from the file or from the panel.
 */
export function applyHomeTexts(
  home: Dictionary["home"],
  settings: Record<string, string>,
): Dictionary["home"] {
  const copy = structuredClone(home) as Record<string, Record<string, unknown>>;

  for (const section of HOME_SECTIONS) {
    for (const path of HOME_TEXT_FIELDS[section] as readonly string[]) {
      const value = settings[homeTextKey(section, path)];
      if (!value) continue;

      const steps = path.split(".");
      const leaf = steps.pop() as string;
      let target: Record<string, unknown> = copy[section];
      for (const step of steps) {
        target = target[step] as Record<string, unknown>;
      }
      target[leaf] = value;
    }
  }

  return copy as unknown as Dictionary["home"];
}

/* ------------------------------------------------------------------ */
/* Features                                                            */
/* ------------------------------------------------------------------ */

/**
 * The strip's four promises, in the order they are drawn. Each is two lines
 * of copy the panel can rewrite and an icon it cannot: the icons are what
 * make the row scan as four different things, and a wrong one would say
 * more than a wrong word.
 */
export const HOME_FEATURES = ["shipping", "payment", "authentic", "returns"] as const;

export type HomeFeature = (typeof HOME_FEATURES)[number];

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

/**
 * Jackets in one pass of the hero marquee. The row is rendered twice and the
 * track slides by one row, so this number fixes both how much is in view and
 * how far a loop travels — the 48s in `globals.css` was timed against it. It
 * is also how many the panel may pick; a shorter list cycles what it has.
 */
export const HERO_SHOWCASE_SIZE = 12;

/** Where the hero's two buttons go unless the panel says otherwise. */
export const HERO_DEFAULT_LINKS = {
  primaryHref: "/books",
  secondaryHref: "/categories",
} as const;

export const HERO_KEYS = {
  featuredBook: "home.hero.featuredBookId",
  showcase: "home.hero.showcaseIds",
  primaryHref: "home.hero.primaryHref",
  secondaryHref: "home.hero.secondaryHref",
} as const;

export interface HeroContent {
  /** The title the tagline pill links to; `null` leaves it to the catalogue. */
  featuredBookId: string | null;
  /** Jackets for the marquee in the order they enter; empty leaves it to the catalogue. */
  showcaseIds: string[];
  primaryHref: string;
  secondaryHref: string;
}

export function readHeroContent(settings: Record<string, string>): HeroContent {
  return {
    featuredBookId: settings[HERO_KEYS.featuredBook] || null,
    showcaseIds: parseIdList(settings[HERO_KEYS.showcase]).slice(0, HERO_SHOWCASE_SIZE),
    primaryHref: settings[HERO_KEYS.primaryHref] || HERO_DEFAULT_LINKS.primaryHref,
    secondaryHref: settings[HERO_KEYS.secondaryHref] || HERO_DEFAULT_LINKS.secondaryHref,
  };
}

/** A picked list is stored as a JSON array of ids; anything else reads as none. */
export function parseIdList(raw: string | undefined): string[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string" && id !== "")
      : [];
  } catch {
    return [];
  }
}

/**
 * A link the panel may point a button at: a path on this site or an
 * absolute web address. Nothing else — a `javascript:` URL in a hero button
 * would run for every visitor.
 */
export function isSafeHref(value: string): boolean {
  return /^\/(?!\/)/.test(value) || /^https?:\/\//i.test(value);
}
