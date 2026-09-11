import type { Metadata } from "next";

import { InfoPage } from "@/components/layout/info-page";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary(defaultLocale);

  return { title: dictionary.info.terms.title };
}

export default async function Page() {
  const locale = defaultLocale;

  const dictionary = await getDictionary(locale);
  const page = dictionary.info.terms;

  return (
    <InfoPage
      title={page.title}
      subtitle={page.subtitle}
      sections={page.sections}
      crumbsLabel={dictionary.common.menu}
      crumbs={[
        { label: dictionary.common.home, href: "/" },
        { label: page.title },
      ]}
    />
  );
}
