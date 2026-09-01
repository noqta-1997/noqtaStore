import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, isLocale } from "@/i18n/config";
import { landingPath } from "@/lib/landing";
import { createClient } from "@/utils/supabase/server";

/**
 * Where an OAuth provider returns the reader. The `code` has to be exchanged
 * on the server so the session lands in cookies the rest of the app can read;
 * exchanging it in the browser would leave every server route signed out.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const rawLocale = searchParams.get("locale") ?? "";
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  const requested = searchParams.get("next");
  const code = searchParams.get("code");
  const providerError = searchParams.get("error_description") ?? searchParams.get("error");

  if (providerError || !code) {
    const failed = new URL(`/${locale}/login`, origin);
    failed.searchParams.set("error", "oauth");
    return NextResponse.redirect(failed);
  }

  const supabase = createClient(await cookies());
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const failed = new URL(`/${locale}/login`, origin);
    failed.searchParams.set("error", "oauth");
    return NextResponse.redirect(failed);
  }

  // Only decidable once the session exists: the role lives behind it.
  return NextResponse.redirect(new URL(await landingPath(locale, requested), origin));
}
