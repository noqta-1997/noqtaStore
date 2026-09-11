import { addresses, orders as customerOrders } from "@/data/account";
import type {
  AdminReview,
  AdminStats,
  CategoryShare,
  CustomerSummary,
  Order,
  OrderItem,
  OrderStatus,
  OrderTimelineEntry,
  PaymentMethod,
  SalesPoint,
  ShippingMethod,
  TopBookStat,
} from "@/types";

const statusFlow: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
];

/** Builds a plausible timeline from the order's current status. */
function buildTimeline(status: OrderStatus, createdAt: string): OrderTimelineEntry[] {
  if (status === "cancelled") {
    return [
      { status: "pending", date: createdAt, done: true },
      { status: "cancelled", date: createdAt, done: true },
    ];
  }

  const reached = statusFlow.indexOf(status);
  const start = new Date(createdAt);

  return statusFlow.map((step, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      status: step,
      date: date.toISOString().slice(0, 10),
      done: index <= reached,
    };
  });
}

interface OrderSeed {
  id: string;
  reference: string;
  createdAt: string;
  status: OrderStatus;
  customerId: string;
  items: OrderItem[];
  shippingCost: number;
  discount: number;
  paymentMethod: PaymentMethod;
  shippingMethod: ShippingMethod;
}

function makeOrder(seed: OrderSeed): Order & { customerId: string } {
  const subtotal = seed.items.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0,
  );

  return {
    id: seed.id,
    reference: seed.reference,
    createdAt: seed.createdAt,
    status: seed.status,
    items: seed.items,
    subtotal,
    shippingCost: seed.shippingCost,
    discount: seed.discount,
    total: subtotal + seed.shippingCost - seed.discount,
    paymentMethod: seed.paymentMethod,
    shippingMethod: seed.shippingMethod,
    address: addresses[0],
    timeline: buildTimeline(seed.status, seed.createdAt),
    customerId: seed.customerId,
  };
}

export const customers: CustomerSummary[] = [
  {
    id: "cu1",
    name: "مصطفى الجبوري",
    email: "mustafa@example.com",
    phone: "+964 770 123 4567",
    city: { ar: "بغداد" },
    ordersCount: 4,
    totalSpent: 166000,
    joinedAt: "2024-11-03",
    status: "active",
  },
  {
    id: "cu2",
    name: "زينب العبيدي",
    email: "zainab@example.com",
    phone: "+964 771 884 2210",
    city: { ar: "البصرة" },
    ordersCount: 9,
    totalSpent: 412000,
    joinedAt: "2024-06-19",
    status: "active",
  },
  {
    id: "cu3",
    name: "علي كاظم",
    email: "ali.kadhim@example.com",
    phone: "+964 780 551 7788",
    city: { ar: "النجف" },
    ordersCount: 2,
    totalSpent: 58000,
    joinedAt: "2025-02-08",
    status: "active",
  },
  {
    id: "cu4",
    name: "هدى الساعدي",
    email: "huda@example.com",
    phone: "+964 750 330 9911",
    city: { ar: "أربيل" },
    ordersCount: 6,
    totalSpent: 287000,
    joinedAt: "2024-09-27",
    status: "active",
  },
  {
    id: "cu5",
    name: "أحمد الربيعي",
    email: "ahmed.r@example.com",
    phone: "+964 782 118 6644",
    city: { ar: "كربلاء" },
    ordersCount: 1,
    totalSpent: 22000,
    joinedAt: "2026-01-14",
    status: "active",
  },
  {
    id: "cu6",
    name: "نور الدين حسن",
    email: "noureddine@example.com",
    phone: "+964 773 902 5510",
    city: { ar: "الموصل" },
    ordersCount: 3,
    totalSpent: 94000,
    joinedAt: "2025-05-30",
    status: "blocked",
  },
  {
    id: "cu7",
    name: "سارة المالكي",
    email: "sara.m@example.com",
    phone: "+964 751 447 2093",
    city: { ar: "بغداد" },
    ordersCount: 12,
    totalSpent: 538000,
    joinedAt: "2023-12-02",
    status: "active",
  },
  {
    id: "cu8",
    name: "حسن الطائي",
    email: "hassan.t@example.com",
    phone: "+964 770 664 1187",
    city: { ar: "ذي قار" },
    ordersCount: 5,
    totalSpent: 173000,
    joinedAt: "2025-08-11",
    status: "active",
  },
  {
    id: "cu9",
    name: "ريم الخفاجي",
    email: "reem@example.com",
    phone: "+964 781 220 8834",
    city: { ar: "بابل" },
    ordersCount: 7,
    totalSpent: 244000,
    joinedAt: "2025-03-22",
    status: "active",
  },
  {
    id: "cu10",
    name: "يوسف الشمري",
    email: "yousif@example.com",
    phone: "+964 772 559 3301",
    city: { ar: "السليمانية" },
    ordersCount: 2,
    totalSpent: 61000,
    joinedAt: "2026-02-05",
    status: "active",
  },
];

/** Store-wide orders — the customer's own four plus other buyers'. */
export const adminOrders: (Order & { customerId: string })[] = [
  ...customerOrders.map((order) => ({ ...order, customerId: "cu1" })),
  makeOrder({
    id: "o5",
    reference: "NQ-2026-4231",
    createdAt: "2026-08-27",
    status: "pending",
    customerId: "cu7",
    items: [
      { bookId: "b23", quantity: 1, unitPrice: 30000 },
      { bookId: "b1", quantity: 2, unitPrice: 15000 },
    ],
    shippingCost: 0,
    discount: 0,
    paymentMethod: "cod",
    shippingMethod: "standard",
  }),
  makeOrder({
    id: "o6",
    reference: "NQ-2026-4228",
    createdAt: "2026-08-26",
    status: "processing",
    customerId: "cu2",
    items: [{ bookId: "b25", quantity: 1, unitPrice: 40000 }],
    shippingCost: 0,
    discount: 4000,
    paymentMethod: "wallet",
    shippingMethod: "express",
  }),
  makeOrder({
    id: "o7",
    reference: "NQ-2026-4210",
    createdAt: "2026-08-24",
    status: "shipped",
    customerId: "cu4",
    items: [
      { bookId: "b16", quantity: 3, unitPrice: 10000 },
      { bookId: "b29", quantity: 1, unitPrice: 12000 },
    ],
    shippingCost: 5000,
    discount: 0,
    paymentMethod: "cod",
    shippingMethod: "standard",
  }),
  makeOrder({
    id: "o8",
    reference: "NQ-2026-4198",
    createdAt: "2026-08-22",
    status: "delivered",
    customerId: "cu9",
    items: [{ bookId: "b19", quantity: 1, unitPrice: 18000 }],
    shippingCost: 5000,
    discount: 0,
    paymentMethod: "cod",
    shippingMethod: "standard",
  }),
  makeOrder({
    id: "o9",
    reference: "NQ-2026-4176",
    createdAt: "2026-08-19",
    status: "delivered",
    customerId: "cu8",
    items: [
      { bookId: "b24", quantity: 1, unitPrice: 28000 },
      { bookId: "b26", quantity: 1, unitPrice: 27000 },
    ],
    shippingCost: 0,
    discount: 5000,
    paymentMethod: "wallet",
    shippingMethod: "standard",
  }),
  makeOrder({
    id: "o10",
    reference: "NQ-2026-4155",
    createdAt: "2026-08-15",
    status: "cancelled",
    customerId: "cu3",
    items: [{ bookId: "b7", quantity: 1, unitPrice: 35000 }],
    shippingCost: 5000,
    discount: 0,
    paymentMethod: "cod",
    shippingMethod: "standard",
  }),
  makeOrder({
    id: "o11",
    reference: "NQ-2026-4142",
    createdAt: "2026-08-12",
    status: "delivered",
    customerId: "cu2",
    items: [
      { bookId: "b12", quantity: 1, unitPrice: 24000 },
      { bookId: "b13", quantity: 1, unitPrice: 14000 },
      { bookId: "b14", quantity: 1, unitPrice: 13000 },
    ],
    shippingCost: 0,
    discount: 0,
    paymentMethod: "cod",
    shippingMethod: "standard",
  }),
  makeOrder({
    id: "o12",
    reference: "NQ-2026-4120",
    createdAt: "2026-08-08",
    status: "delivered",
    customerId: "cu10",
    items: [{ bookId: "b28", quantity: 1, unitPrice: 32000 }],
    shippingCost: 5000,
    discount: 0,
    paymentMethod: "cod",
    shippingMethod: "express",
  }),
];

export const adminReviews: AdminReview[] = [
  {
    id: "ar1",
    bookId: "b9",
    bookTitle: { ar: "فرانكشتاين في بغداد" },
    authorName: "سارة المالكي",
    rating: 5,
    title: { ar: "رواية لا تُنسى" },
    body: {
      ar: "أفضل ما قرأت هذا العام، والطبعة ممتازة.",
    },
    createdAt: "2026-08-26",
    status: "pending",
  },
  {
    id: "ar2",
    bookId: "b16",
    bookTitle: { ar: "الأمير الصغير" },
    authorName: "هدى الساعدي",
    rating: 5,
    title: { ar: "لكل الأعمار" },
    body: {
      ar: "اشتريته لابني وقرأته أنا مرتين.",
    },
    createdAt: "2026-08-25",
    status: "pending",
  },
  {
    id: "ar3",
    bookId: "b1",
    bookTitle: { ar: "موسم الهجرة إلى الشمال" },
    authorName: "علي كاظم",
    rating: 4,
    title: { ar: "كلاسيكية" },
    body: {
      ar: "لغة عالية تحتاج قراءة متأنية.",
    },
    createdAt: "2026-08-21",
    status: "published",
  },
  {
    id: "ar4",
    bookId: "b27",
    bookTitle: { ar: "العادات السبع" },
    authorName: "أحمد الربيعي",
    rating: 3,
    title: { ar: "مفيد لكنه مطوّل" },
    body: {
      ar: "الأفكار جيدة والأمثلة مكرّرة.",
    },
    createdAt: "2026-08-18",
    status: "published",
  },
  {
    id: "ar5",
    bookId: "b23",
    bookTitle: { ar: "الأعمال الشعرية الكاملة" },
    authorName: "ريم الخفاجي",
    rating: 5,
    title: { ar: "مجلد يستحق" },
    body: {
      ar: "الطباعة والورق بمستوى عالٍ.",
    },
    createdAt: "2026-08-14",
    status: "published",
  },
  {
    id: "ar6",
    bookId: "b13",
    bookTitle: { ar: "1984" },
    authorName: "زائر",
    rating: 1,
    title: { ar: "رسالة إعلانية" },
    body: {
      ar: "روابط دعائية غير متعلقة بالكتاب.",
    },
    createdAt: "2026-08-10",
    status: "rejected",
  },
  {
    id: "ar7",
    bookId: "b12",
    bookTitle: { ar: "مئة عام من العزلة" },
    authorName: "يوسف الشمري",
    rating: 5,
    title: { ar: "ترجمة رائعة" },
    body: {
      ar: "قرأتها بترجمة أخرى سابقًا وهذه أفضل.",
    },
    createdAt: "2026-08-06",
    status: "published",
  },
  {
    id: "ar8",
    bookId: "b5",
    bookTitle: { ar: "ثلاثية غرناطة" },
    authorName: "حسن الطائي",
    rating: 4,
    title: { ar: "عمل ضخم" },
    body: {
      ar: "يحتاج وقتًا لكنه يستحق.",
    },
    createdAt: "2026-08-02",
    status: "pending",
  },
];

export const salesSeries: SalesPoint[] = [
  { month: "2025-09", revenue: 1840000, orders: 62 },
  { month: "2025-10", revenue: 2130000, orders: 74 },
  { month: "2025-11", revenue: 2480000, orders: 86 },
  { month: "2025-12", revenue: 3320000, orders: 118 },
  { month: "2026-01", revenue: 2610000, orders: 91 },
  { month: "2026-02", revenue: 2870000, orders: 99 },
  { month: "2026-03", revenue: 3040000, orders: 104 },
  { month: "2026-04", revenue: 2760000, orders: 95 },
  { month: "2026-05", revenue: 3180000, orders: 110 },
  { month: "2026-06", revenue: 3450000, orders: 121 },
  { month: "2026-07", revenue: 3720000, orders: 129 },
  { month: "2026-08", revenue: 4090000, orders: 142 },
];

export const topBooks: TopBookStat[] = [
  { bookId: "b16", sold: 184, revenue: 1840000 },
  { bookId: "b1", sold: 152, revenue: 2280000 },
  { bookId: "b12", sold: 131, revenue: 3144000 },
  { bookId: "b19", sold: 118, revenue: 2124000 },
  { bookId: "b27", sold: 97, revenue: 2134000 },
];

export const categoryShares: CategoryShare[] = [
  { categoryId: "c1", share: 38 },
  { categoryId: "c3", share: 17 },
  { categoryId: "c5", share: 14 },
  { categoryId: "c2", share: 11 },
  { categoryId: "c6", share: 9 },
  { categoryId: "c7", share: 6 },
  { categoryId: "c4", share: 3 },
  { categoryId: "c8", share: 2 },
];

export const adminStats: AdminStats = {
  revenue: { value: 4090000, change: 9.8 },
  orders: { value: 142, change: 10.1 },
  customers: { value: 1284, change: 4.3 },
  books: { value: 1467, change: 1.2 },
};
