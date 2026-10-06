import type { Locale } from "@/i18n/config";
import type { HandoutCategoryNode, Subject } from "@/types";

/**
 * A branch as the header's menus and the phone drawer list it: a name, where
 * it leads, and what hangs under it. Built on the server from the tree so
 * the client islands carry plain data and know nothing about slugs.
 */
export interface MenuBranch {
  id: string;
  name: string;
  href: string;
  children: MenuBranch[];
}

/**
 * The menu's shape for one catalogue. The tree's top-level branches split in
 * two: those with branches under them — the stages — each become a column,
 * and the childless ones — the genres the store opened with, or a branch the
 * panel has only just added — are gathered into one list at the end, so a
 * panel of twelve top-level branches does not become twelve columns.
 */
export interface CatalogueMenu {
  /** The nav label, "الملازم". */
  label: string;
  /** The catalogue's own listing, and the wording of the link to it. */
  href: string;
  allLabel: string;
  /** The heading of the gathered childless branches. */
  othersLabel: string;
  columns: MenuBranch[];
  others: MenuBranch[];
}

type TreeNode = HandoutCategoryNode;

/**
 * A branch with nothing under it opens on the subjects it has handouts in, if
 * any — the branch's page filtered to each — so the deepest level of the
 * menu is "السادس العلمي ← الفيزياء" without the tree holding subjects.
 */
function toMenuBranch(
  node: TreeNode,
  locale: Locale,
  hrefFor: (slug: string) => string,
  subjectsOf: (branchId: string) => Subject[],
): MenuBranch {
  const href = hrefFor(node.slug);
  const children = node.children.length
    ? node.children.map((child) => toMenuBranch(child, locale, hrefFor, subjectsOf))
    : subjectsOf(node.id).map((subject) => ({
        id: `${node.id}/${subject.id}`,
        name: subject.name[locale],
        href: `${href}?subject=${encodeURIComponent(subject.slug)}`,
        children: [],
      }));

  return { id: node.id, name: node.name[locale], href, children };
}

export function buildCatalogueMenu(
  roots: TreeNode[],
  locale: Locale,
  hrefFor: (slug: string) => string,
  wording: Pick<CatalogueMenu, "label" | "href" | "allLabel" | "othersLabel">,
  subjectsOf: (branchId: string) => Subject[] = () => [],
): CatalogueMenu {
  const branches = roots.map((root) => toMenuBranch(root, locale, hrefFor, subjectsOf));

  return {
    ...wording,
    columns: branches.filter((branch) => branch.children.length > 0),
    others: branches.filter((branch) => branch.children.length === 0),
  };
}
