import type { NextRequest } from "next/server";

import { updateSession } from "@/utils/supabase/middleware";

/**
 * Next 16 renamed the `middleware` convention to `proxy`. This runs before
 * every matched request and keeps the Supabase session fresh; the helper in
 * utils/supabase/middleware is inert without it.
 *
 * There is no compatibility redirect here. `/en/*` and `/ar/*` both existed
 * while the site had a locale segment, and both are gone — but the store has
 * never been published, so there is no bookmark, no inbound link and no search
 * index pointing at either. A redirect would exist only to serve traffic that
 * cannot exist. Add one here if that ever stops being true.
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
