import { schoolTree } from "@/data/school-tree";
import type { HandoutCategory } from "@/types";

/**
 * The handouts' tree. Its own table, so it is its own seed: the school ladder
 * again, plus the three genres the seeded handouts were filed under before the
 * tables split — kept under the same ids, ordered after the ladder, until the
 * handouts are re-filed and the panel deletes them.
 */
const genres: HandoutCategory[] = [
  {
    id: "c1",
    slug: "literature",
    name: { ar: "أدب وروايات" },
    description: { ar: "روايات ومجموعات قصصية عربية ومترجمة" },
    icon: "BookOpen",
    parentId: null,
    sortOrder: 10,
    handoutsCount: 0,
  },
  {
    id: "c2",
    slug: "history",
    name: { ar: "تاريخ" },
    description: { ar: "تاريخ الحضارات والأمم والمدن" },
    icon: "Landmark",
    parentId: null,
    sortOrder: 11,
    handoutsCount: 0,
  },
  {
    id: "c6",
    slug: "science",
    name: { ar: "علوم وتكنولوجيا" },
    description: { ar: "الفيزياء والفلك والتقنية المبسّطة" },
    icon: "Atom",
    parentId: null,
    sortOrder: 12,
    handoutsCount: 0,
  },
];

/** The school ladder, filed as the handouts catalogue reads it. */
const ladder: HandoutCategory[] = schoolTree("hc", {
  grade: (grade) => `ملازم الصف ${grade}`,
  branch: (branch, grade) => `ملازم الفرع ${branch} من الصف ${grade}`,
}).map(({ name, description, ...branch }) => ({
  ...branch,
  name: { ar: name },
  description: { ar: description },
  handoutsCount: 0,
}));

export const handoutCategories: HandoutCategory[] = [...ladder, ...genres];
