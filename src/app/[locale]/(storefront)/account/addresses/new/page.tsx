import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddressForm } from "@/components/account/address-form";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

interface NewAddressPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: NewAddressPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(isLocale(locale) ? locale : "ar");

  return { title: dictionary.account.addresses.form.newTitle };
}

export default async function NewAddressPage({ params }: NewAddressPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);
  const t = dictionary.account.addresses.form;

  return (
    <div className="space-y-6">
      <Link
        href={`/${locale}/account/addresses`}
        className="inline-flex items-center gap-2 text-label-md text-on-surface underline-offset-4 hover:underline"
      >
        <ArrowRight aria-hidden className="size-4 rotate-180 rtl:rotate-0" strokeWidth={1.75} />
        {dictionary.account.addresses.title}
      </Link>

      <header className="space-y-1">
        <h2 className="text-headline-md">{t.newTitle}</h2>
        <p className="text-body-md text-muted">{t.newSubtitle}</p>
      </header>

      <AddressForm
        locale={locale}
        dictionary={dictionary}
        cancelHref={`/${locale}/account/addresses`}
      />
    </div>
  );
}
