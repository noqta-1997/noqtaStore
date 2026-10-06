/**
 * The store's public origin, with no trailing slash.
 *
 * Canonical links, Open Graph URLs, the sitemap and the structured data all
 * need absolute URLs, and the request is not available to every one of them
 * (the sitemap and statically generated pages have none), so the origin is
 * configuration. `NEXT_PUBLIC_SITE_URL` is the one to set in production; a
 * Vercel deployment supplies its production domain on its own, and anything
 * else falls back to the dev server so a local build still renders.
 */
export const siteUrl = resolveSiteUrl();

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/**
 * A path on the store as a full URL. `URL` percent-encodes the Arabic
 * slugs, which is the form a sitemap and a JSON-LD `@id` must carry.
 */
export function absoluteUrl(path: string): string {
  return new URL(path, `${siteUrl}/`).toString();
}
