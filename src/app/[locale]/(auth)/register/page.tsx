import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { SocialButtons } from "@/components/auth/social-buttons";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

interface RegisterPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: RegisterPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(isLocale(locale) ? locale : "ar");

  return { title: dictionary.auth.registerTitle };
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);
  const t = dictionary.auth;

  return (
    <AuthShell
      title={t.registerTitle}
      subtitle={t.registerSubtitle}
      dictionary={dictionary}
    >
      <SocialButtons
        locale={locale}
        labels={{
          google: t.google,
          divider: t.orContinue,
          failure: t.errors.generic,
        }}
      />

      <RegisterForm
        locale={locale}
        t={t}
        validation={dictionary.common.validation}
      />

      <p className="text-center text-body-md text-on-surface-variant">
        {t.hasAccount}{" "}
        <Link
          href={`/${locale}/login`}
          className="font-semibold text-on-surface underline underline-offset-4"
        >
          {t.signIn}
        </Link>
      </p>
    </AuthShell>
  );
}
