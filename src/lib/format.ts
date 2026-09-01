import type { Locale } from "@/i18n/config";

/**
 * Latin digits are forced in both locales so prices stay legible in the
 * mono type scale. Swap the numbering system here if that ever changes.
 */
const numberLocale: Record<Locale, string> = {
  ar: "ar-IQ-u-nu-latn",
  en: "en-US",
};

const currencySuffix: Record<Locale, string> = {
  ar: "د.ع",
  en: "IQD",
};

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(numberLocale[locale], {
    maximumFractionDigits: 0,
  }).format(value);
}

/** Years are labels, not quantities, so they carry no thousands separator. */
export function formatYear(value: number, locale: Locale): string {
  return new Intl.NumberFormat(numberLocale[locale], {
    useGrouping: false,
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

export function formatDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-IQ-u-nu-latn-ca-gregory" : "en-US",
    { day: "numeric", month: "long", year: "numeric" },
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
