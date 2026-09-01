import type { NextRequest } from "next/server";

import { updateSession } from "@/utils/supabase/middleware";

/**
 * Next 16 renamed the `middleware` convention to `proxy`. This runs before
 * every matched request and keeps the Supabase session fresh; the helper in
 * utils/supabase/middleware is inert without it.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image files, so the session is
     * refreshed on page requests only.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)",
  ],
};
