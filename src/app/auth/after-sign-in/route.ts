import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, isLocale } from "@/i18n/config";
import { landingPath } from "@/lib/landing";

/**
 * The single hop the browser-side sign-in forms take once Supabase has issued
 * a session. Only the server can read the reader's role, so only the server
 * can decide whether they belong in the panel or in their account.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const rawLocale = searchParams.get("locale") ?? "";
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  const destination = await landingPath(locale, searchParams.get("next"));

  return NextResponse.redirect(new URL(destination, origin));
}
