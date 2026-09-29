/**
 * The store's clock. Dates that name a day — an order's reference — are
 * read in Baghdad, not in UTC: at one in the morning the day has changed
 * for the customer but not yet on the server.
 */
export const STORE_TIME_ZONE = "Asia/Baghdad";

/** The same clock as an ISO offset; Iraq keeps no summer time. */
export const STORE_UTC_OFFSET = "+03:00";

/** This year on the store's clock. */
export function storeYear(): number {
  return Number(
    new Intl.DateTimeFormat("en", { timeZone: STORE_TIME_ZONE, year: "numeric" }).format(new Date()),
  );
}

/**
 * The latest publication year a title may carry: next year, because a school
 * year's handouts carry the year it ends in. The title form bounds its field
 * with it and the save actions check it.
 */
export function latestPublishedYear(): number {
  return storeYear() + 1;
}

/**
 * Iraqi governorates, used by address forms across the storefront.
 *
 * Plain Arabic strings since English was removed. The English name used to be
 * the `<option value>` — a stable key that the Arabic label was shown against
 * — and it is what older orders and addresses stored in `shippingGovernorate`.
 * Those rows keep the value they were written with; the column is a snapshot
 * of what the buyer chose, not a foreign key, so nothing dereferences it and
 * nothing breaks. New rows store the Arabic name.
 */
export const governorates: string[] = [
  "بغداد",
  "البصرة",
  "نينوى",
  "أربيل",
  "النجف",
  "كربلاء",
  "ذي قار",
  "بابل",
  "الأنبار",
  "ديالى",
  "كركوك",
  "السليمانية",
  "واسط",
  "ميسان",
  "المثنى",
  "القادسية",
  "صلاح الدين",
  "دهوك",
];
