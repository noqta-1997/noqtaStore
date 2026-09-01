import type { Review } from "@/types";

/** A handful of reviews per popular title — enough to design against. */
export const reviews: Review[] = [
  {
    id: "r1",
    bookId: "b1",
    authorName: "زينب ع.",
    rating: 5,
    title: { ar: "لا يشبه غيره", en: "Unlike anything else" },
    body: {
      ar: "قرأتها مرتين، وفي كل مرة أخرج بقراءة مختلفة. اللغة وحدها تستحق.",
      en: "I read it twice and came out with a different reading each time. The prose alone is worth it.",
    },
    createdAt: "2026-06-14",
  },
  {
    id: "r2",
    bookId: "b1",
    authorName: "مصطفى ح.",
    rating: 4,
    title: { ar: "طبعة جيدة", en: "Good edition" },
    body: {
      ar: "الورق ممتاز والخط مريح. وصلني خلال ثلاثة أيام إلى البصرة.",
      en: "Excellent paper and comfortable type. Reached Basra in three days.",
    },
    createdAt: "2026-05-02",
  },
  {
    id: "r3",
    bookId: "b1",
    authorName: "سارة ك.",
    rating: 5,
    title: { ar: "نهاية تبقى معك", en: "An ending that stays" },
    body: {
      ar: "الفصل الأخير أعادني إلى بداية الرواية فورًا. عمل لا يُنسى.",
      en: "The last chapter sent me straight back to the opening. Unforgettable.",
    },
    createdAt: "2026-03-21",
  },
  {
    id: "r4",
    bookId: "b9",
    authorName: "علي ج.",
    rating: 5,
    title: { ar: "بغداد كما لم تُروَ", en: "Baghdad as never told" },
    body: {
      ar: "خيال أسود يمسك بالواقع من رقبته. مكتوبة بحرفية عالية.",
      en: "Dark imagination gripping reality by the throat. Superbly written.",
    },
    createdAt: "2026-07-01",
  },
  {
    id: "r5",
    bookId: "b9",
    authorName: "هدى م.",
    rating: 4,
    title: { ar: "ثقيلة لكنها تستحق", en: "Heavy but worth it" },
    body: {
      ar: "تحتاج مزاجًا هادئًا، لكن الفكرة تلاحقك بعد الانتهاء.",
      en: "It needs a calm mood, but the idea follows you after you finish.",
    },
    createdAt: "2026-04-18",
  },
  {
    id: "r6",
    bookId: "b12",
    authorName: "أحمد ر.",
    rating: 5,
    title: { ar: "ترجمة موفقة", en: "A fine translation" },
    body: {
      ar: "طبعة المدى مريحة والترجمة سلسة. الكتاب نفسه لا يحتاج تعريفًا.",
      en: "The Al-Mada edition reads smoothly. The book itself needs no introduction.",
    },
    createdAt: "2026-06-29",
  },
  {
    id: "r7",
    bookId: "b16",
    authorName: "نور س.",
    rating: 5,
    title: { ar: "هدية مثالية", en: "A perfect gift" },
    body: {
      ar: "اشتريته لابنتي فقرأناه معًا. الغلاف المقوّى يستحق الفرق بالسعر.",
      en: "Bought it for my daughter and we read it together. The hardcover is worth the difference.",
    },
    createdAt: "2026-07-11",
  },
  {
    id: "r8",
    bookId: "b27",
    authorName: "ليث ن.",
    rating: 4,
    title: { ar: "عملي ومباشر", en: "Practical and direct" },
    body: {
      ar: "أفكاره معروفة لكن ترتيبها هو المفيد. طبّقت عادتين وأثرهما واضح.",
      en: "The ideas are familiar, the ordering is what helps. I applied two habits with clear effect.",
    },
    createdAt: "2026-05-25",
  },
];
