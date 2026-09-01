import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
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
      <SocialButtons
        locale={locale}
        labels={{
          google: t.google,
          divider: t.orContinue,
          failure: t.errors.generic,
        }}
      />

      {/* The form reads `?next=` so it needs a boundary to prerender. */}
      <Suspense fallback={<div className="h-72" />}>
        <LoginForm locale={locale} t={t} validation={dictionary.common.validation} />
      </Suspense>

      <p className="text-center text-body-md text-on-surface-variant">
        {t.noAccount}{" "}
        <Link
          href={`/${locale}/register`}
          className="font-semibold text-on-surface underline underline-offset-4"
        >
          {t.createOne}
        </Link>
      </p>
    </AuthShell>
  );
}
