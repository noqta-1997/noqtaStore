import type { NextConfig } from "next";

import { COVER_PUBLIC_PATH } from "./src/lib/cover-image";

/*
 * Covers are stored in the project's Supabase bucket, and `next/image` will
 * only optimise a remote host it has been told about. The host is read from
 * the same variable the app reads — Next loads `.env.local` before it
 * evaluates this file — so the two cannot disagree, and the pattern is pinned
 * to the one public bucket rather than the whole host.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * The response headers every page carries. No Content-Security-Policy yet:
 * the theme script in the root layout is inline and would need a nonce on
 * every request, which would end the static rendering the storefront is
 * built around. These three cost nothing and close the obvious doors — the
 * store is never framed, and nothing it serves is meant to be sniffed into
 * another type.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  // The framework's name is nobody's business.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  images: {
    remotePatterns: supabaseUrl
      ? [
          {
            protocol: "https",
            hostname: new URL(supabaseUrl).hostname,
            pathname: `${COVER_PUBLIC_PATH}**`,
          },
        ]
      : [],
  },
  experimental: {
    serverActions: {
      // The default is 1 MB. A cover may be the 2 MB the picker allows, and
      // the rest is room for the multipart framing and the other fields.
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;
