import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Paths that require a session, matched after the locale segment. */
const protectedSegments = ["account", "admin"];

function isProtected(pathname: string) {
  // Route handlers carry no locale segment and answer with a status of their
  // own, so a redirect here would send them to a page that cannot exist.
  if (pathname.startsWith("/api/")) return false;

  const [, , segment] = pathname.split("/");
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
    const locale = pathname.split("/")[1] || "ar";
    const login = request.nextUrl.clone();
    login.pathname = `/${locale}/login`;
    login.search = `?next=${encodeURIComponent(pathname)}`;

    return NextResponse.redirect(login);
  }

  return supabaseResponse;
}
