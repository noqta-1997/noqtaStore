/**
 * The store speaks Arabic, and only Arabic.
 *
 * English was removed for good rather than hidden: the dictionaries, the
 * switcher, the `en` branch of every lookup and the English columns in the
 * database are gone, so there is no half-translated surface waiting to be
 * re-enabled by accident.
 *
 * The `[locale]` URL segment went with it — `/ar/books` is `/books` now. The
 * store had never been published, so no bookmark or inbound link pointed at
 * the prefixed paths and nothing needed a redirect (see `src/proxy.ts`).
 *
 * What stays is the shape: a `Locale` type with one member, `Localized`
 * values keyed by it, and dictionaries looked up by it. Every page reads
 * `defaultLocale` where it used to read the route param. That costs almost
 * nothing while the type holds a single value, and it is what a second
 * language would need back if one is ever wanted — an entry here, a
 * dictionary, and the segment restored, rather than a rewrite of 70 pages.
 */
export const locales = ["ar"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

export const localeDirection: Record<Locale, "rtl" | "ltr"> = {
  ar: "rtl",
};

export const localeNames: Record<Locale, string> = {
  ar: "العربية",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
