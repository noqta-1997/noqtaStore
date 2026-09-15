import type { Category } from "@/types";

export const categories: Category[] = [
  {
    id: "c1",
    slug: "literature",
    name: { ar: "أدب وروايات" },
    description: {
      ar: "روايات ومجموعات قصصية عربية ومترجمة",
    },
    icon: "BookOpen",
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
    booksCount: 76,
  },
];
