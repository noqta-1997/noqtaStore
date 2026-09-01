import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddressForm } from "@/components/account/address-form";
import { getAddressById } from "@/data";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

interface EditAddressPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: EditAddressPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(isLocale(locale) ? locale : "ar");

  return { title: dictionary.account.addresses.form.editTitle };
}

export default async function EditAddressPage({ params }: EditAddressPageProps) {
  const { locale, id } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const address = await getAddressById(id);

  if (!address) {
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
        <ArrowRight aria-hidden className="size-4 rotate-180 rtl:rotate-0" strokeWidth={2} />
        {dictionary.account.addresses.title}
      </Link>

      <header className="space-y-1">
        <h2 className="text-headline-md">{t.editTitle}</h2>
        <p className="text-body-md text-muted">{t.editSubtitle}</p>
      </header>

      <AddressForm
        locale={locale}
        dictionary={dictionary}
        address={address}
        cancelHref={`/${locale}/account/addresses`}
      />
    </div>
  );
}
