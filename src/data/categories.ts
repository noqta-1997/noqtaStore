import { schoolTree } from "@/data/school-tree";
import type { Category } from "@/types";

/**
 * The genres the store opened with. They sit as top-level branches beside the
 * school ladder, ordered after it, until their titles are re-filed and the
 * panel deletes them.
 */
const genres: Category[] = [
  {
    id: "c1",
    slug: "literature",
    name: { ar: "أدب وروايات" },
    description: {
      ar: "روايات ومجموعات قصصية عربية ومترجمة",
    },
    icon: "BookOpen",
    parentId: null,
    sortOrder: 10,
    booksCount: 428,
  },
  {
    id: "c2",
    slug: "history",
    name: { ar: "تاريخ" },
    description: {
      ar: "تاريخ الحضارات والأمم والمدن",
    },
    icon: "Landmark",
    parentId: null,
    sortOrder: 11,
    booksCount: 176,
  },
  {
    id: "c3",
    slug: "self-development",
    name: { ar: "تنمية ذاتية" },
    description: {
      ar: "مهارات وعادات وأدوات لتطوير الذات",
    },
    icon: "Sprout",
    parentId: null,
    sortOrder: 12,
    booksCount: 214,
  },
  {
    id: "c4",
    slug: "philosophy",
    name: { ar: "فلسفة وفكر" },
    description: {
      ar: "الفلسفة والمنطق والفكر النقدي",
    },
    icon: "BrainCircuit",
    parentId: null,
    sortOrder: 13,
    booksCount: 132,
  },
  {
    id: "c5",
    slug: "children",
    name: { ar: "أطفال وناشئة" },
    description: {
      ar: "قصص مصوّرة وكتب مدرسية للأطفال واليافعين",
    },
    icon: "ToyBrick",
    parentId: null,
    sortOrder: 14,
    booksCount: 189,
  },
  {
    id: "c6",
    slug: "science",
    name: { ar: "علوم وتكنولوجيا" },
    description: {
      ar: "الفيزياء والفلك والتقنية المبسّطة",
    },
    icon: "Atom",
    parentId: null,
    sortOrder: 15,
    booksCount: 154,
  },
  {
    id: "c7",
    slug: "biographies",
    name: { ar: "سير وتراجم" },
    description: {
      ar: "سير ذاتية وشهادات ومذكرات",
    },
    icon: "UserRound",
    parentId: null,
    sortOrder: 16,
    booksCount: 98,
  },
  {
    id: "c8",
    slug: "poetry",
    name: { ar: "شعر" },
    description: {
      ar: "دواوين شعرية كلاسيكية وحديثة",
    },
    icon: "Feather",
    parentId: null,
    sortOrder: 17,
    booksCount: 76,
  },
];

/** The school ladder, filed as the textbook catalogue reads it. */
const ladder: Category[] = schoolTree("c", {
  grade: (grade) => `الكتب المدرسية للصف ${grade}`,
  branch: (branch, grade) => `الكتب المدرسية للفرع ${branch} من الصف ${grade}`,
}).map(({ name, description, ...branch }) => ({
  ...branch,
  name: { ar: name },
  description: { ar: description },
  booksCount: 0,
}));

export const categories: Category[] = [...ladder, ...genres];
