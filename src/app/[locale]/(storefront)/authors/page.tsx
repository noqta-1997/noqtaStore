import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AuthorCard } from "@/components/author/author-card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { getAuthors } from "@/data";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

interface AuthorsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: AuthorsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(isLocale(locale) ? locale : "ar");

  return { title: dictionary.authorsPage.title };
}

export default async function AuthorsPage({ params }: AuthorsPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const [dictionary, authors] = await Promise.all([
    getDictionary(locale),
    getAuthors(),
  ]);

  return (
    <>
      <PageHeader
        title={dictionary.authorsPage.title}
        subtitle={dictionary.authorsPage.subtitle}
        crumbsLabel={dictionary.common.menu}
        crumbs={[
          { label: dictionary.common.home, href: `/${locale}` },
          { label: dictionary.authorsPage.title },
        ]}
      />

      <Container className="py-8 lg:py-12">
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {authors.map((author) => (
            <li key={author.id}>
              <AuthorCard
                author={author}
                locale={locale}
                booksLabel={dictionary.home.authors.booksCount}
              />
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
