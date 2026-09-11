import "server-only";

import type { Locale } from "@/i18n/config";
import ar from "@/i18n/dictionaries/ar.json";
import adminAr from "@/i18n/dictionaries/admin.ar.json";

export type Dictionary = typeof ar;
export type AdminDictionary = typeof adminAr;

/*
 * Still a lookup by locale, with one entry in it.
 *
 * These were maps of lazy imports while there were two languages. Arabic is
 * the only one now, so both dictionaries are imported directly and the maps
 * are plain — but they stay maps, and the functions keep taking a `Locale`.
 * Every caller passes `defaultLocale` where it used to pass the route param,
 * so a second language would be an entry here rather than a change across 70
 * pages.
 */
const dictionaries: Record<Locale, Dictionary> = { ar };
const adminDictionaries: Record<Locale, AdminDictionary> = { ar: adminAr };

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale];
}

export async function getAdminDictionary(
  locale: Locale,
): Promise<AdminDictionary> {
  return adminDictionaries[locale];
}
