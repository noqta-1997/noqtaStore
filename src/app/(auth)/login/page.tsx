import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { SocialButtons } from "@/components/auth/social-buttons";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary(defaultLocale);

  return { title: dictionary.auth.loginTitle };
}

export default async function LoginPage() {
  const locale = defaultLocale;

  const dictionary = await getDictionary(locale);
  const t = dictionary.auth;

  return (
    <AuthShell title={t.loginTitle} subtitle={t.loginSubtitle} dictionary={dictionary}>
      {/* Reads `?next=` and `?error=oauth`, so it needs a boundary to prerender. */}
      <Suspense fallback={<div className="h-12" />}>
        <SocialButtons labels={{ google: t.google, failure: t.errors.generic }} />
      </Suspense>
    </AuthShell>
  );
}
