import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InfoPage } from "@/components/layout/info-page";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(isLocale(locale) ? locale : "ar");

  return { title: dictionary.info.returns.title };
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);
  const page = dictionary.info.returns;

  return (
    <InfoPage
      title={page.title}
      subtitle={page.subtitle}
      sections={page.sections}
      crumbsLabel={dictionary.common.menu}
      crumbs={[
        { label: dictionary.common.home, href: `/${locale}` },
        { label: page.title },
      ]}
    />
  );
}
