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
  "publishers",
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
  bestsellers: ["title", "subtitle"],
  categories: ["title", "subtitle", "count"],
  promo: ["eyebrow", "title", "description", "cta"],
  newArrivals: ["title", "subtitle"],
  publishers: ["handoutsTitle", "handoutsSubtitle", "booksTitle", "booksSubtitle"],
  authors: ["title", "subtitle", "booksCount"],
  newsletter: ["title", "description", "placeholder", "cta", "note"],
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
/* Shelves                                                             */
/* ------------------------------------------------------------------ */

/** What a shelf holds, which decides what its picker searches. */
export type ShelfKind = "book" | "category" | "author" | "publisher";

interface ShelfShape {
  kind: ShelfKind;
  /** How many the rule shows unless told otherwise; `null` is all of them. */
  limit: number | null;
  /** The most a shelf may hold, by rule or by hand. */
  max: number;
}

/**
 * The shelves the panel may fill by hand instead of by rule. Twenty titles
 * is four rows of the widest grid and twelve authors four rows of theirs;
 * the category tiles have always shown every category, so their rule has
 * no count until the panel gives it one. The publishers section counts
 * presses, not titles: each press it shows gets up to two shelves of its
 * own, so four of them is already most of a page.
 */
export const HOME_SHELVES = {
  bestsellers: { kind: "book", limit: 10, max: 20 },
  categories: { kind: "category", limit: null, max: 16 },
  newArrivals: { kind: "book", limit: 5, max: 20 },
  publishers: { kind: "publisher", limit: 4, max: 12 },
  authors: { kind: "author", limit: 6, max: 12 },
} as const satisfies Partial<Record<HomeSection, ShelfShape>>;

/**
 * How many titles each of a publisher's shelves shows: one row of the
 * widest grid, the same as the new-arrivals shelf it is modelled on. The
 * "view all" link under the row is the way to the rest.
 */
export const PUBLISHER_SHELF_SIZE = 5;

/**
 * The publisher's name laid into one of the section's strings. The strings
 * say `{publisher}` where the name goes, so the panel can put it at the
 * start of a title or the end of one — or leave it out of a subtitle.
 */
export function fillPublisherText(template: string, name: string): string {
  return template.replaceAll("{publisher}", name);
}

export type HomeShelf = keyof typeof HOME_SHELVES;

export type ShelfMode = "auto" | "manual";

export interface ShelfContent {
  /** `auto` follows the shelf's rule; `manual` shows `ids` in order. */
  mode: ShelfMode;
  /** How many the rule shows; `null` is all of them. */
  limit: number | null;
  /** The hand-picked entries, in the order they are drawn. */
  ids: string[];
}

export function isHomeShelf(section: HomeSection): section is HomeShelf {
  return section in HOME_SHELVES;
}

/** The `store_settings` rows a shelf's mode, count and picks are kept in. */
export function shelfKeys(shelf: HomeShelf) {
  return {
    mode: `home.${shelf}.mode`,
    limit: `home.${shelf}.limit`,
    ids: `home.${shelf}.ids`,
  } as const;
}

/**
 * A shelf's content as the panel left it. A count outside the shelf's range
 * — a row written by hand, or a `max` lowered since — reads as the default
 * rather than as a shelf of one or of a hundred.
 */
export function readShelfContent(
  settings: Record<string, string>,
  shelf: HomeShelf,
): ShelfContent {
  const keys = shelfKeys(shelf);
  const { limit, max } = HOME_SHELVES[shelf];
  const stored = Number(settings[keys.limit]);

  return {
    mode: settings[keys.mode] === "manual" ? "manual" : "auto",
    limit: Number.isInteger(stored) && stored >= 1 && stored <= max ? stored : limit,
    ids: parseIdList(settings[keys.ids]).slice(0, max),
  };
}

/**
 * How a shelf resolves: the panel's picks, in its order, while it has
 * switched the shelf to manual and any of them still exist; otherwise the
 * shelf's rule, cut to the panel's count. Shared by every shelf so that the
 * data layer's job per shelf is only to say what "by ids" and "by rule"
 * mean for what it holds.
 */
export async function resolveShelf<T>(
  content: ShelfContent,
  byIds: (ids: string[]) => Promise<T[]>,
  byRule: (limit: number | undefined) => Promise<T[]>,
): Promise<T[]> {
  if (content.mode === "manual" && content.ids.length) {
    const picked = await byIds(content.ids);
    if (picked.length) return picked;
  }

  return byRule(content.limit ?? undefined);
}

/* ------------------------------------------------------------------ */
/* Promo                                                               */
/* ------------------------------------------------------------------ */

/**
 * The banner's two values that are not copy: where its button goes, and the
 * figure ghosted behind it. The figure was "25%" in the component's markup,
 * separate from the headline that said the same — so a rewritten headline
 * would have kept the old number behind it.
 */
export const PROMO_DEFAULTS = { href: "/offers", figure: "25%" } as const;

/** The figure is set at 12–18rem; more characters than this run off the card. */
export const PROMO_FIGURE_MAX = 6;

export const PROMO_KEYS = {
  href: "home.promo.href",
  figure: "home.promo.figure",
} as const;

export interface PromoContent {
  href: string;
  figure: string;
}

export function readPromoContent(settings: Record<string, string>): PromoContent {
  return {
    href: settings[PROMO_KEYS.href] || PROMO_DEFAULTS.href,
    figure: settings[PROMO_KEYS.figure] || PROMO_DEFAULTS.figure,
  };
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

/**
 * The most jackets the hero's showcase carries. It is what the panel may
 * pick and what the catalogue rule fetches; the carousel loops whatever it
 * is given, so a shorter list is a shorter loop rather than a padded one.
 * Three rows of the thumbnail strip at its widest, which is as many as a
 * reader will scrub through.
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
  /** Jackets for the showcase in the order they play; empty leaves it to the catalogue. */
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
