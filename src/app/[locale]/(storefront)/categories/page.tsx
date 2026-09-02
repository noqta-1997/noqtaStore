import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookCover } from "@/components/book/book-cover";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { getCategories, queryBooks } from "@/data";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatNumber } from "@/lib/format";

interface CategoriesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: CategoriesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(isLocale(locale) ? locale : "ar");

  return { title: dictionary.categoriesPage.title };
}

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const [dictionary, categories] = await Promise.all([
    getDictionary(locale),
    getCategories(),
  ]);

  /* Three covers per shelf give each card a sense of what's inside. */
  const previews = await Promise.all(
    categories.map(async (category) => {
      const result = await queryBooks({
        category: category.slug,
        sort: "popular",
        perPage: 3,
      });
      return { category, books: result.items };
    }),
  );

  const t = dictionary.categoriesPage;

  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        crumbsLabel={dictionary.common.menu}
        crumbs={[
          { label: dictionary.common.home, href: `/${locale}` },
          { label: t.title },
        ]}
      />

      <Container className="py-8 lg:py-12">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {previews.map(({ category, books }) => (
            <li key={category.id}>
              <Link
                href={`/${locale}/categories/${category.slug}`}
                className="group flex h-full flex-col gap-4 rounded-md border border-line bg-card p-5 transition-[box-shadow,background-color] duration-100 ease-fluent hover:bg-card-hover hover:elevation-md focus-within:elevation-md"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-md border border-line bg-surface-low transition-colors group-hover:bg-primary-container group-hover:text-on-primary-container">
                    <CategoryIcon name={category.icon} className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-bold text-on-surface">
                      {category.name[locale]}
                    </h2>
                    <p className="text-body-md text-muted">
                      {category.description[locale]}
                    </p>
                  </div>
                </div>

                <ul className="flex gap-2">
                  {books.map((book) => (
                    <li key={book.id} className="w-16">
                      <BookCover
                        title={book.title[locale]}
                        author={book.author.name[locale]}
                        seed={book.slug}
                        src={book.coverUrl}
                        sizes="4rem"
                        className="border border-line"
                      />
                    </li>
                  ))}
                </ul>

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-line-divider pt-4">
                  <span className="font-mono text-label-sm text-muted" data-numeric>
                    {formatNumber(category.booksCount, locale)}{" "}
                    {dictionary.home.categories.count}
                  </span>
                  <span className="flex items-center gap-1.5 text-label-md text-on-surface">
                    {t.browse}
                    <ArrowRight
                      aria-hidden
                      className="size-4 transition-transform duration-100 ease-fluent group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                      strokeWidth={2}
                    />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
