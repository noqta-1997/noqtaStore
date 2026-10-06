/**
 * Structured data for search engines, as a plain `<script>` (it is data, not
 * code, so `next/script` has nothing to offer it).
 *
 * `JSON.stringify` does not escape `<`, and the payload carries text the
 * panel writes — a description holding `</script>` would end the tag and
 * whatever followed would run. Escaping every `<` closes that.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", ...data }).replace(
          /</g,
          "\\u003c",
        ),
      }}
    />
  );
}
