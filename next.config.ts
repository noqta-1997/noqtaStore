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

const nextConfig: NextConfig = {
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
