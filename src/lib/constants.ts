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
