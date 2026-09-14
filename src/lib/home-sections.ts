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
