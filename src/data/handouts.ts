import type { Handout, Localized } from "@/types";

const ARABIC: Localized = { ar: "العربية" };

/**
 * Seed input for the handouts table, shaped like `SeedBook`: the publisher is
 * a name here because the seed creates the publisher rows from the catalogue.
 */
export type SeedHandout = Omit<Handout, "publisherId"> & { publisher: Localized };

/**
 * Three lecture-note booklets (ملازم) so the catalogue has something on its
 * shelves.
 */
export const handouts: SeedHandout[] = [
  {
    id: "h1",
    slug: "physics-sixth-scientific",
    title: { ar: "ملزمة الفيزياء — السادس العلمي" },
    authorId: "a15",
    categoryId: "c6",
    price: 7000,
    rating: 0,
    reviewsCount: 0,
    stock: 40,
    pages: 120,
    publisher: { ar: "دار الكتب العلمية" },
    publishedYear: 2026,
    language: ARABIC,
    description: {
      ar: "شرح مبسّط لمنهج الفيزياء للصف السادس العلمي مع حلول الأسئلة الوزارية للسنوات الخمس الأخيرة.",
    },
    tags: ["new"],
    createdAt: "2026-09-01",
  },
  {
    id: "h2",
    slug: "modern-iraq-history",
    title: { ar: "ملزمة تاريخ العراق الحديث" },
    authorId: "a7",
    categoryId: "c2",
    price: 6000,
    rating: 0,
    reviewsCount: 0,
    stock: 25,
    pages: 96,
    publisher: { ar: "دار المدى" },
    publishedYear: 2025,
    language: ARABIC,
    description: {
      ar: "ملخّص محاضرات تاريخ العراق من تأسيس الدولة الحديثة حتى نهاية القرن العشرين، مرتّب بحسب فصول المنهج.",
    },
    tags: ["bestseller"],
    createdAt: "2026-08-20",
  },
  {
    id: "h3",
    slug: "arabic-literature-fourth-stage",
    title: { ar: "ملزمة الأدب العربي — المرحلة الرابعة" },
    authorId: "a20",
    categoryId: "c1",
    price: 8000,
    compareAtPrice: 10000,
    rating: 0,
    reviewsCount: 0,
    stock: 8,
    pages: 150,
    publisher: { ar: "دار الرافدين" },
    publishedYear: 2026,
    language: ARABIC,
    description: {
      ar: "نصوص الشعر الحديث المقرّرة مع تحليلها ومقدّمات نقدية موجزة لكل مدرسة أدبية.",
    },
    tags: ["featured"],
    createdAt: "2026-09-05",
  },
];
