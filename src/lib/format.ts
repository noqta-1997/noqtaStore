import type { Locale } from "@/i18n/config";
import { STORE_TIME_ZONE } from "@/lib/constants";

/**
 * Latin digits are forced in both locales so prices stay legible in the
 * mono type scale. Swap the numbering system here if that ever changes.
 */
const numberLocale: Record<Locale, string> = {
  ar: "ar-IQ-u-nu-latn",
};

const currencySuffix: Record<Locale, string> = {
  ar: "د.ع",
};

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(numberLocale[locale], {
    maximumFractionDigits: 0,
  }).format(value);
}

/** Prices are stored as whole Iraqi dinars — no minor units. */
export function formatPrice(value: number, locale: Locale): string {
  return `${formatNumber(value, locale)} ${currencySuffix[locale]}`;
}

export function formatDiscount(
  price: number,
  compareAtPrice: number,
  locale: Locale,
): string {
  const percentage = Math.round((1 - price / compareAtPrice) * 100);
  return `${formatNumber(percentage, locale)}%`;
}

export function formatCompactNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(numberLocale[locale], {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** A calendar day with no time on it, `YYYY-MM-DD`. */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** `YYYY-MM-DD` in the store's own time zone; `en-CA` prints ISO order. */
const storeDayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: STORE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * The day a moment falls on for the store — Baghdad's calendar, not the
 * server's. `toISOString().slice(0, 10)` gave the UTC day, which at one in
 * the morning here is still yesterday: an order placed then was dated the
 * day before, and its reference (drawn with this rule already) disagreed.
 */
export function storeDateKey(value: Date = new Date()): string {
  return storeDayFormat.format(value);
}

/**
 * A date-only string is a calendar day and is shown as that day wherever
 * the code runs: parsed as UTC midnight by `Date`, it is formatted in UTC
 * too, so a server west of Greenwich cannot print the day before. A full
 * timestamp is shown on the store's clock.
 */
export function formatDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-IQ-u-nu-latn-ca-gregory" : "en-US",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: DATE_ONLY.test(value) ? "UTC" : STORE_TIME_ZONE,
    },
  ).format(new Date(value));
}

/** "2026-08" → a short month label such as "آب" / "Aug". */
export function formatMonth(month: string, locale: Locale): string {
  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-IQ-u-nu-latn-ca-gregory" : "en-US",
    { month: "short" },
  ).format(new Date(`${month}-01T00:00:00`));
}

/** Large money figures shortened for dashboard tiles. */
export function formatCompactPrice(value: number, locale: Locale): string {
  return `${formatCompactNumber(value, locale)} ${locale === "ar" ? "د.ع" : "IQD"}`;
}
