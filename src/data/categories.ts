import type { Category } from "@/types";

export const categories: Category[] = [
  {
    id: "c1",
    slug: "literature",
    name: { ar: "أدب وروايات", en: "Literature & Fiction" },
    description: {
      ar: "روايات ومجموعات قصصية عربية ومترجمة",
      en: "Arabic and translated novels and short stories",
    },
    icon: "BookOpen",
    booksCount: 428,
  },
  {
    id: "c2",
    slug: "history",
    name: { ar: "تاريخ", en: "History" },
    description: {
      ar: "تاريخ الحضارات والأمم والمدن",
      en: "Histories of civilizations, nations and cities",
    },
    icon: "Landmark",
    booksCount: 176,
  },
  {
    id: "c3",
    slug: "self-development",
    name: { ar: "تنمية ذاتية", en: "Self Development" },
    description: {
      ar: "مهارات وعادات وأدوات لتطوير الذات",
      en: "Habits, skills and tools for personal growth",
    },
    icon: "Sprout",
    booksCount: 214,
  },
  {
    id: "c4",
    slug: "philosophy",
    name: { ar: "فلسفة وفكر", en: "Philosophy & Thought" },
    description: {
      ar: "الفلسفة والمنطق والفكر النقدي",
      en: "Philosophy, logic and critical thought",
    },
    icon: "BrainCircuit",
    booksCount: 132,
  },
  {
    id: "c5",
    slug: "children",
    name: { ar: "أطفال وناشئة", en: "Children & YA" },
    description: {
      ar: "قصص مصوّرة وكتب للأطفال واليافعين",
      en: "Picture books and reads for young readers",
    },
    icon: "ToyBrick",
    booksCount: 189,
  },
  {
    id: "c6",
    slug: "science",
    name: { ar: "علوم وتكنولوجيا", en: "Science & Tech" },
    description: {
      ar: "الفيزياء والفلك والتقنية المبسّطة",
      en: "Physics, astronomy and accessible tech",
    },
    icon: "Atom",
    booksCount: 154,
  },
  {
    id: "c7",
    slug: "biographies",
    name: { ar: "سير وتراجم", en: "Biographies" },
    description: {
      ar: "سير ذاتية وشهادات ومذكرات",
      en: "Memoirs, testimonies and life stories",
    },
    icon: "UserRound",
    booksCount: 98,
  },
  {
    id: "c8",
    slug: "poetry",
    name: { ar: "شعر", en: "Poetry" },
    description: {
      ar: "دواوين شعرية كلاسيكية وحديثة",
      en: "Classical and modern poetry collections",
    },
    icon: "Feather",
    booksCount: 76,
  },
];
