import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AddressForm } from "@/components/account/address-form";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary(defaultLocale);

  return { title: dictionary.account.addresses.form.newTitle };
}

export default async function NewAddressPage() {
  const locale = defaultLocale;

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
        <h2 className="text-headline-md">{t.newTitle}</h2>
        <p className="text-body-md text-muted">{t.newSubtitle}</p>
      </header>

      <AddressForm
        locale={locale}
        dictionary={dictionary}
        cancelHref={`/account/addresses`}
      />
    </div>
  );
}
