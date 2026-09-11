import type { Review } from "@/types";

/** A handful of reviews per popular title — enough to design against. */
export const reviews: Review[] = [
  {
    id: "r1",
    bookId: "b1",
    authorName: "زينب ع.",
    rating: 5,
    title: { ar: "لا يشبه غيره" },
    body: {
      ar: "قرأتها مرتين، وفي كل مرة أخرج بقراءة مختلفة. اللغة وحدها تستحق.",
    },
    createdAt: "2026-06-14",
  },
  {
    id: "r2",
    bookId: "b1",
    authorName: "مصطفى ح.",
    rating: 4,
    title: { ar: "طبعة جيدة" },
    body: {
      ar: "الورق ممتاز والخط مريح. وصلني خلال ثلاثة أيام إلى البصرة.",
    },
    createdAt: "2026-05-02",
  },
  {
    id: "r3",
    bookId: "b1",
    authorName: "سارة ك.",
    rating: 5,
    title: { ar: "نهاية تبقى معك" },
    body: {
      ar: "الفصل الأخير أعادني إلى بداية الرواية فورًا. عمل لا يُنسى.",
    },
    createdAt: "2026-03-21",
  },
  {
    id: "r4",
    bookId: "b9",
    authorName: "علي ج.",
    rating: 5,
    title: { ar: "بغداد كما لم تُروَ" },
    body: {
      ar: "خيال أسود يمسك بالواقع من رقبته. مكتوبة بحرفية عالية.",
    },
    createdAt: "2026-07-01",
  },
  {
    id: "r5",
    bookId: "b9",
    authorName: "هدى م.",
    rating: 4,
    title: { ar: "ثقيلة لكنها تستحق" },
    body: {
      ar: "تحتاج مزاجًا هادئًا، لكن الفكرة تلاحقك بعد الانتهاء.",
    },
    createdAt: "2026-04-18",
  },
  {
    id: "r6",
    bookId: "b12",
    authorName: "أحمد ر.",
    rating: 5,
    title: { ar: "ترجمة موفقة" },
    body: {
      ar: "طبعة المدى مريحة والترجمة سلسة. الكتاب نفسه لا يحتاج تعريفًا.",
    },
    createdAt: "2026-06-29",
  },
  {
    id: "r7",
    bookId: "b16",
    authorName: "نور س.",
    rating: 5,
    title: { ar: "هدية مثالية" },
    body: {
      ar: "اشتريته لابنتي فقرأناه معًا. الغلاف المقوّى يستحق الفرق بالسعر.",
    },
    createdAt: "2026-07-11",
  },
  {
    id: "r8",
    bookId: "b27",
    authorName: "ليث ن.",
    rating: 4,
    title: { ar: "عملي ومباشر" },
    body: {
      ar: "أفكاره معروفة لكن ترتيبها هو المفيد. طبّقت عادتين وأثرهما واضح.",
    },
    createdAt: "2026-05-25",
  },
];
