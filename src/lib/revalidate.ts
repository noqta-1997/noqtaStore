import { revalidatePath } from "next/cache";

/*
 * How a path has to be spelled for Next to find the cached page.
 *
 * On-demand revalidation is a tag match. A cached page carries a tag for
 * its route *file*, route group included — `/books/imarat-yacoubian` is
 * tagged `_N_T_/(storefront)/books/[slug]/page` — and one for its own URL,
 * `_N_T_/books/imarat-yacoubian`. `revalidatePath` builds one tag from what
 * it is given: a literal path with no `type` becomes the URL tag; a path
 * with a `type` becomes a file tag, exactly as written.
 *
 * So `revalidatePath("/books/[slug]", "page")` names a file that does not
 * exist, since every storefront page sits under `(storefront)`, and matches
 * nothing; and `revalidatePath("/books", "page")` asks for a file tag where
 * only the URL tag would match. Every call in this codebase used to be of
 * one of those two kinds, and the panel's edits reached the cached catalogue
 * only when a page's five-minute window ran out. The rule, then: a literal
 * URL is passed on its own, and a pattern with its route group spelled out.
 */

/**
 * The storefront's catalogue pages are cached (`revalidate = 300`) and show
 * the shelf on every card — sold out, a few left — so anything that moves a
 * copy on or off it invalidates them: a title saved or deleted in the panel,
 * an order placed, cancelled or brought back.
 */
export function revalidateCatalogue() {
  revalidatePath("/");
  revalidatePath("/books");
  revalidatePath("/(storefront)/books/[slug]", "page");
  revalidatePath("/categories");
  revalidatePath("/(storefront)/categories/[slug]", "page");
  revalidatePath("/authors");
  revalidatePath("/(storefront)/authors/[slug]", "page");
  revalidatePath("/publishers");
  revalidatePath("/(storefront)/publishers/[slug]", "page");
}

/**
 * The handout pages are cached the same way, and the category, author and
 * publisher pages carry a handouts section under their books — as does the
 * home page, where each featured press shelves its latest handouts.
 */
export function revalidateHandouts() {
  revalidatePath("/");
  revalidatePath("/handouts");
  revalidatePath("/(storefront)/handouts/[slug]", "page");
  revalidatePath("/handouts/categories");
  revalidatePath("/(storefront)/handouts/categories/[slug]", "page");
  revalidatePath("/(storefront)/categories/[slug]", "page");
  revalidatePath("/(storefront)/authors/[slug]", "page");
  revalidatePath("/(storefront)/publishers/[slug]", "page");
  revalidatePath("/admin/handouts");
  revalidatePath("/admin/handout-reviews");
}
