import { revalidatePath } from "next/cache";

/*
 * How a path has to be spelled for Next to find the cached page.
 *
 * On-demand revalidation is a tag match. A cached page carries a tag for
 * its route *file*, route group included — `/handouts/physics` is tagged
 * `_N_T_/(storefront)/handouts/[slug]/page` — and one for its own URL,
 * `_N_T_/handouts/physics`. `revalidatePath` builds one tag from what
 * it is given: a literal path with no `type` becomes the URL tag; a path
 * with a `type` becomes a file tag, exactly as written.
 *
 * So `revalidatePath("/handouts/[slug]", "page")` names a file that does not
 * exist, since every storefront page sits under `(storefront)`, and matches
 * nothing; and `revalidatePath("/handouts", "page")` asks for a file tag where
 * only the URL tag would match. Every call in this codebase used to be of
 * one of those two kinds, and the panel's edits reached the cached catalogue
 * only when a page's five-minute window ran out. The rule, then: a literal
 * URL is passed on its own, and a pattern with its route group spelled out.
 */

/**
 * The header hangs the category tree under its catalogue link, and the
 * storefront layout that draws it is baked into every cached storefront page
 * — the static ones too (`/about`, `/faq`, `/terms`…), which nothing else
 * revalidates, so a branch added in the panel stayed out of their menus until
 * the next deploy.
 * A page's tags include one per layout above it, `/(storefront)/layout`
 * among them, so this one call reaches every page under that layout and none
 * outside it.
 */
export function revalidateCategoryMenu() {
  revalidatePath("/(storefront)", "layout");
}

/**
 * The storefront's catalogue pages are cached (`revalidate = 300`) and show
 * the shelf on every card — sold out, a few left — so anything that moves a
 * copy on or off it invalidates them: a title saved or deleted in the panel,
 * an order placed, cancelled or brought back. The author and publisher pages
 * list their handouts, and the home page shelves each featured press's.
 */
export function revalidateHandouts() {
  revalidatePath("/");
  revalidatePath("/handouts");
  revalidatePath("/(storefront)/handouts/[slug]", "page");
  revalidatePath("/handouts/categories");
  revalidatePath("/(storefront)/handouts/categories/[slug]", "page");
  revalidatePath("/authors");
  revalidatePath("/(storefront)/authors/[slug]", "page");
  revalidatePath("/publishers");
  revalidatePath("/(storefront)/publishers/[slug]", "page");
  revalidatePath("/admin/handouts");
  revalidatePath("/admin/handout-reviews");
}
