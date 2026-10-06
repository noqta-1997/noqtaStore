import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

/**
 * The shop is open to crawlers; the panel, the customer's own pages, the
 * flows and the endpoints are not — all of them sit behind a sign-in or a
 * cart, so a crawler fetching them only ever meets a redirect. The pages
 * also say `noindex` themselves, for crawlers that do not read this file.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/cart", "/checkout", "/api/", "/auth/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
