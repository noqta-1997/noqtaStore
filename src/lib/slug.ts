/**
 * A dynamic segment as a page should read it.
 *
 * Next hands the page component the raw path segment — percent-encoded when
 * the slug carries Arabic letters, as the panel's branch slugs do — while
 * `generateMetadata` for the same request gets it decoded. A page that looked
 * the raw form up found nothing and showed its not-found shell under a
 * correct title. Reading both through this makes them agree; a Latin slug
 * passes through untouched, and a malformed sequence is kept as it came.
 */
export function readSlug(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
