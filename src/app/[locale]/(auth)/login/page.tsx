import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { SocialButtons } from "@/components/auth/social-buttons";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

interface LoginPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LoginPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(isLocale(locale) ? locale : "ar");

  return { title: dictionary.auth.loginTitle };
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);
  const t = dictionary.auth;

  return (
    <AuthShell title={t.loginTitle} subtitle={t.loginSubtitle} dictionary={dictionary}>
      {/* Reads `?next=` and `?error=oauth`, so it needs a boundary to prerender. */}
      <Suspense fallback={<div className="h-12" />}>
        <SocialButtons
          locale={locale}
          labels={{ google: t.google, failure: t.errors.generic }}
        />
      </Suspense>
    </AuthShell>
  );
}
