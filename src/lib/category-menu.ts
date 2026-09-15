import type { Locale } from "@/i18n/config";
import type { CategoryNode, HandoutCategoryNode } from "@/types";

/**
 * A branch as the header's menus and the phone drawer list it: a name, where
 * it leads, and what hangs under it. Built on the server from either tree so
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
  /** The nav label, "الكتب المدرسية" or "الملازم". */
  label: string;
  /** The catalogue's own listing, and the wording of the link to it. */
  href: string;
  allLabel: string;
  /** The heading of the gathered childless branches. */
  othersLabel: string;
  columns: MenuBranch[];
  others: MenuBranch[];
}

type TreeNode = CategoryNode | HandoutCategoryNode;

function toMenuBranch(node: TreeNode, locale: Locale, hrefFor: (slug: string) => string): MenuBranch {
  return {
    id: node.id,
    name: node.name[locale],
    href: hrefFor(node.slug),
    children: node.children.map((child) => toMenuBranch(child, locale, hrefFor)),
  };
}

export function buildCatalogueMenu(
  roots: TreeNode[],
  locale: Locale,
  hrefFor: (slug: string) => string,
  wording: Pick<CatalogueMenu, "label" | "href" | "allLabel" | "othersLabel">,
): CatalogueMenu {
  const branches = roots.map((root) => toMenuBranch(root, locale, hrefFor));

  return {
    ...wording,
    columns: branches.filter((branch) => branch.children.length > 0),
    others: branches.filter((branch) => branch.children.length === 0),
  };
}
