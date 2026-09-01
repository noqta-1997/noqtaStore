import type {
  Address,
  CartLine,
  Customer,
  Order,
  ReviewWithStatus,
} from "@/types";

export const addresses: Address[] = [
  {
    id: "ad1",
    label: { ar: "المنزل", en: "Home" },
    fullName: "مصطفى الجبوري",
    phone: "+964 770 123 4567",
    governorate: { ar: "بغداد", en: "Baghdad" },
    city: { ar: "الكرادة", en: "Karrada" },
    line: {
      ar: "قرب جامع الحسنين، بناية 12، الطابق الثاني",
      en: "Near Al-Hasanain Mosque, building 12, second floor",
    },
    isDefault: true,
  },
  {
    id: "ad2",
    label: { ar: "العمل", en: "Work" },
    fullName: "مصطفى الجبوري",
    phone: "+964 781 998 2210",
    governorate: { ar: "بغداد", en: "Baghdad" },
    city: { ar: "المنصور", en: "Mansour" },
    line: {
      ar: "شارع 14 رمضان، مقابل مصرف الرافدين",
      en: "14 Ramadan Street, opposite Rafidain Bank",
    },
    isDefault: false,
  },
];

export const customer: Customer = {
  id: "cu1",
  name: "مصطفى الجبوري",
  email: "mustafa@example.com",
  phone: "+964 770 123 4567",
  birthDate: "1994-04-12",
  memberSince: "2024-11-03",
  addresses,
  preferences: {
    newsletter: true,
    offers: false,
  },
  stats: {
    orders: 4,
    wishlist: 6,
    booksBought: 17,
  },
};

/** The mock basket the storefront renders until a real cart store exists. */
export const cartLines: CartLine[] = [
  { bookId: "b5", quantity: 1 },
  { bookId: "b12", quantity: 2 },
  { bookId: "b16", quantity: 1 },
];

export const wishlistBookIds = ["b1", "b7", "b9", "b23", "b24", "b28"];

export const orders: Order[] = [
  {
    id: "o1",
    reference: "NQ-2026-4187",
    createdAt: "2026-08-21",
    status: "shipped",
    items: [
      { bookId: "b9", quantity: 1, unitPrice: 19000 },
      { bookId: "b13", quantity: 1, unitPrice: 14000 },
    ],
    subtotal: 33000,
    shippingCost: 5000,
    discount: 0,
    total: 38000,
    paymentMethod: "cod",
    shippingMethod: "standard",
    address: addresses[0],
    timeline: [
      { status: "pending", date: "2026-08-21", done: true },
      { status: "processing", date: "2026-08-22", done: true },
      { status: "shipped", date: "2026-08-24", done: true },
      { status: "delivered", date: "2026-08-27", done: false },
    ],
  },
  {
    id: "o2",
    reference: "NQ-2026-3902",
    createdAt: "2026-07-09",
    status: "delivered",
    items: [
      { bookId: "b5", quantity: 1, unitPrice: 26000 },
      { bookId: "b16", quantity: 2, unitPrice: 10000 },
      { bookId: "b29", quantity: 1, unitPrice: 12000 },
    ],
    subtotal: 58000,
    shippingCost: 0,
    discount: 5000,
    total: 53000,
    paymentMethod: "cod",
    shippingMethod: "standard",
    address: addresses[0],
    timeline: [
      { status: "pending", date: "2026-07-09", done: true },
      { status: "processing", date: "2026-07-10", done: true },
      { status: "shipped", date: "2026-07-11", done: true },
      { status: "delivered", date: "2026-07-13", done: true },
    ],
  },
  {
    id: "o3",
    reference: "NQ-2026-3554",
    createdAt: "2026-05-30",
    status: "delivered",
    items: [{ bookId: "b23", quantity: 1, unitPrice: 30000 }],
    subtotal: 30000,
    shippingCost: 5000,
    discount: 0,
    total: 35000,
    paymentMethod: "wallet",
    shippingMethod: "express",
    address: addresses[1],
    timeline: [
      { status: "pending", date: "2026-05-30", done: true },
      { status: "processing", date: "2026-05-30", done: true },
      { status: "shipped", date: "2026-05-31", done: true },
      { status: "delivered", date: "2026-05-31", done: true },
    ],
  },
  {
    id: "o4",
    reference: "NQ-2026-3120",
    createdAt: "2026-03-15",
    status: "cancelled",
    items: [{ bookId: "b7", quantity: 1, unitPrice: 35000 }],
    subtotal: 35000,
    shippingCost: 5000,
    discount: 0,
    total: 40000,
    paymentMethod: "cod",
    shippingMethod: "standard",
    address: addresses[0],
    timeline: [
      { status: "pending", date: "2026-03-15", done: true },
      { status: "cancelled", date: "2026-03-16", done: true },
    ],
  },
];

/** Reviews written by the signed-in customer, with their moderation state. */
export const customerReviews: ReviewWithStatus[] = [
  {
    id: "cr1",
    bookId: "b9",
    bookTitle: { ar: "فرانكشتاين في بغداد", en: "Frankenstein in Baghdad" },
    authorName: "مصطفى الجبوري",
    rating: 5,
    title: { ar: "بغداد كما لم تُروَ", en: "Baghdad as never told" },
    body: {
      ar: "خيال أسود يمسك بالواقع من رقبته، وكتابة لا تهادن. أنهيتها في ليلتين.",
      en: "Dark imagination gripping reality by the throat, written without compromise. I finished it in two nights.",
    },
    createdAt: "2026-08-25",
    status: "published",
  },
  {
    id: "cr2",
    bookId: "b13",
    bookTitle: { ar: "1984", en: "Nineteen Eighty-Four" },
    authorName: "مصطفى الجبوري",
    rating: 4,
    title: { ar: "طبعة مريحة", en: "A comfortable edition" },
    body: {
      ar: "الترجمة سلسة وحجم الخط مناسب للقراءة الطويلة.",
      en: "The translation flows and the type size suits long reading.",
    },
    createdAt: "2026-08-23",
    status: "pending",
  },
  {
    id: "cr3",
    bookId: "b5",
    bookTitle: { ar: "ثلاثية غرناطة", en: "The Granada Trilogy" },
    authorName: "مصطفى الجبوري",
    rating: 5,
    title: { ar: "تستحق كل صفحة", en: "Worth every page" },
    body: {
      ar: "ثلاثة أجزاء لا تشعر بطولها، ونهاية تبقى معك أسابيع.",
      en: "Three volumes that never feel long, and an ending that stays with you for weeks.",
    },
    createdAt: "2026-07-12",
    status: "published",
  },
  {
    id: "cr4",
    bookId: "b16",
    bookTitle: { ar: "الأمير الصغير", en: "The Little Prince" },
    authorName: "مصطفى الجبوري",
    rating: 5,
    title: { ar: "قرأناه معًا", en: "We read it together" },
    body: {
      ar: "اشتريته لابنتي، والغلاف المقوّى يستحق فرق السعر.",
      en: "Bought it for my daughter; the hardcover is worth the difference.",
    },
    createdAt: "2026-07-10",
    status: "published",
  },
];
