import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Paths that require a session, matched on the first path segment. */
const protectedSegments = ["account", "admin"];

function isProtected(pathname: string) {
  // Route handlers answer with a status of their own, so a redirect here would
  // send them to a page that cannot exist.
  if (pathname.startsWith("/api/")) return false;

  /*
   * The first segment, not the second. This read `[, , segment]` while every
   * URL carried a locale — `/ar/account` split to ["", "ar", "account"]. With
   * the locale segment gone `/account` splits to ["", "account"], and reading
   * the third element returned undefined: every protected route matched
   * nothing and the whole account and admin half stopped being gated.
   */
  const [, segment] = pathname.split("/");
  return protectedSegments.includes(segment ?? "");
}

/**
 * Refreshes the Supabase session on every matched request and turns anonymous
 * visitors away from the account and admin areas.
 *
 * `getUser()` is what performs the refresh — without it the client is created
 * and nothing is kept alive, so it must not be removed.
 *
 * Role checks live in the admin layout instead: Prisma cannot run here.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        supabaseResponse = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && isProtected(pathname)) {
    const login = request.nextUrl.clone();
    login.pathname = `/login`;
    login.search = `?next=${encodeURIComponent(pathname)}`;

    return NextResponse.redirect(login);
  }

  return supabaseResponse;
}
