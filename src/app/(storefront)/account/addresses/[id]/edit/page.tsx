import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddressForm } from "@/components/account/address-form";
import { getAddressById } from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

interface EditAddressPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary(defaultLocale);

  return { title: dictionary.account.addresses.form.editTitle };
}

export default async function EditAddressPage({ params }: EditAddressPageProps) {
  const { id } = await params;
  const locale = defaultLocale;

  const address = await getAddressById(id);

  if (!address) {
    notFound();
  }

  const dictionary = await getDictionary(locale);
  const t = dictionary.account.addresses.form;

  return (
    <div className="space-y-6">
      <Link
        href={`/account/addresses`}
        className="inline-flex items-center gap-2 text-label-md text-on-surface underline-offset-4 hover:underline"
      >
        <ArrowRight aria-hidden className="size-4 rotate-180 rtl:rotate-0" strokeWidth={1.75} />
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
        cancelHref={`/account/addresses`}
      />
    </div>
  );
}
