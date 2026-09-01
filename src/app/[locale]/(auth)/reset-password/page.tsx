import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

interface ResetPasswordPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: ResetPasswordPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(isLocale(locale) ? locale : "ar");

  return { title: dictionary.auth.resetTitle };
}

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);
  const t = dictionary.auth;

  return (
    <AuthShell title={t.resetTitle} subtitle={t.resetSubtitle} dictionary={dictionary}>
      <ResetPasswordForm
        locale={locale}
        t={t}
        validation={dictionary.common.validation}
      />

      <p className="text-center text-body-md text-on-surface-variant">
        <Link
          href={`/${locale}/login`}
          className="font-semibold text-on-surface underline underline-offset-4"
        >
          {t.backToLogin}
        </Link>
      </p>
    </AuthShell>
  );
}
