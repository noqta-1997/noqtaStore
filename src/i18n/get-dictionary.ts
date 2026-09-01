import "server-only";

import type { Locale } from "@/i18n/config";
import ar from "@/i18n/dictionaries/ar.json";

export type Dictionary = typeof ar;

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  ar: async () => ar,
  en: async () =>
    (await import("@/i18n/dictionaries/en.json")).default as Dictionary,
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}

import adminAr from "@/i18n/dictionaries/admin.ar.json";

export type AdminDictionary = typeof adminAr;

const adminDictionaries: Record<Locale, () => Promise<AdminDictionary>> = {
  ar: async () => adminAr,
  en: async () =>
    (await import("@/i18n/dictionaries/admin.en.json")).default as AdminDictionary,
};

export async function getAdminDictionary(locale: Locale): Promise<AdminDictionary> {
  return adminDictionaries[locale]();
}
