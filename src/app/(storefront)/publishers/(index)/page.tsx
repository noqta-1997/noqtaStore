import { Building2 } from "lucide-react";
import type { Metadata } from "next";

import { PublisherCard } from "@/components/publisher/publisher-card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getPublishers } from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

/** Catalogue content is re-fetched at most every five minutes. */
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary(defaultLocale);

  return { title: dictionary.publishersPage.title };
}

export default async function PublishersPage() {
  const locale = defaultLocale;

  const [dictionary, publishers] = await Promise.all([
    getDictionary(locale),
    getPublishers(),
  ]);

  const t = dictionary.publishersPage;

  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        crumbsLabel={dictionary.common.menu}
        crumbs={[
          { label: dictionary.common.home, href: "/" },
          { label: t.title },
        ]}
      />

      <Container className="py-8 lg:py-12">
        {publishers.length ? (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {publishers.map((publisher) => (
              <li key={publisher.id}>
                <PublisherCard
                  publisher={publisher}
                  locale={locale}
                  booksLabel={dictionary.home.authors.booksCount}
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Building2}
            title={t.empty}
            description={t.subtitle}
            actionLabel={dictionary.common.home}
            actionHref={"/"}
          />
        )}
      </Container>
    </>
  );
}
