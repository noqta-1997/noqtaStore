/**
 * The Iraqi school ladder as the two catalogues file under it: three stages,
 * their grades, and the scientific/literary split of the preparatory grades.
 * Each catalogue seeds its own copy of this tree into its own table, so the
 * shape is written once here and the ids and blurbs are stamped per copy.
 *
 * `sortOrder` is what keeps "الأول" before "الثاني": the panel adds branches
 * of its own later, and those read in the order it gives them.
 */
export interface SchoolBranchSeed {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  parentId: string | null;
  sortOrder: number;
}

interface Wording {
  /** The blurb of a grade, given its name ("الأول الابتدائي"). */
  grade: (grade: string) => string;
  /** The blurb of a branch under a grade ("العلمي", "الرابع الإعدادي"). */
  branch: (branch: string, grade: string) => string;
}

const ordinals = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس"];

const stages = [
  {
    slug: "primary",
    name: "المرحلة الابتدائية",
    description: "الصفوف من الأول إلى السادس الابتدائي",
    icon: "Backpack",
    adjective: "الابتدائي",
    grades: [1, 2, 3, 4, 5, 6],
    branches: false,
  },
  {
    slug: "intermediate",
    name: "المرحلة المتوسطة",
    description: "الصفوف من الأول إلى الثالث المتوسط",
    icon: "School",
    adjective: "المتوسط",
    grades: [1, 2, 3],
    branches: false,
  },
  {
    slug: "preparatory",
    name: "المرحلة الإعدادية",
    description: "الصفوف الرابع والخامس والسادس الإعدادي بفرعيهما العلمي والأدبي",
    icon: "GraduationCap",
    adjective: "الإعدادي",
    grades: [4, 5, 6],
    branches: true,
  },
] as const;

const branches = [
  { slug: "scientific", name: "العلمي", icon: "FlaskConical" },
  { slug: "literary", name: "الأدبي", icon: "Feather" },
] as const;

/** The whole ladder, parents before children, ids prefixed for one table. */
export function schoolTree(prefix: string, wording: Wording): SchoolBranchSeed[] {
  const rows: SchoolBranchSeed[] = [];

  stages.forEach((stage, stageIndex) => {
    const stageId = `${prefix}-${stage.slug}`;
    rows.push({
      id: stageId,
      slug: stage.slug,
      name: stage.name,
      description: stage.description,
      icon: stage.icon,
      parentId: null,
      sortOrder: stageIndex + 1,
    });

    stage.grades.forEach((grade, gradeIndex) => {
      const gradeSlug = `${stage.slug}-${grade}`;
      const gradeId = `${prefix}-${gradeSlug}`;
      const gradeName = `${ordinals[grade - 1]} ${stage.adjective}`;
      rows.push({
        id: gradeId,
        slug: gradeSlug,
        name: gradeName,
        description: wording.grade(gradeName),
        icon: stage.icon,
        parentId: stageId,
        sortOrder: gradeIndex + 1,
      });

      if (!stage.branches) return;

      branches.forEach((branch, branchIndex) => {
        rows.push({
          id: `${prefix}-${gradeSlug}-${branch.slug}`,
          slug: `${gradeSlug}-${branch.slug}`,
          name: branch.name,
          description: wording.branch(branch.name, gradeName),
          icon: branch.icon,
          parentId: gradeId,
          sortOrder: branchIndex + 1,
        });
      });
    });
  });

  return rows;
}
