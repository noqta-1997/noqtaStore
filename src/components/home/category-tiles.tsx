import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { CategoryIcon } from "@/components/ui/category-icon";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatNumber } from "@/lib/format";
import type { Category } from "@/types";

interface CategoryTilesProps {
  locale: Locale;
  dictionary: Dictionary;
  categories: Category[];
}

/**
 * The reference reduces its category row to chips: a round icon, a name, a
 * chevron. This keeps that shape but lets the tile grow a second line, so the
 * description and the title count that were already here stay on the page
 * instead of being dropped to match a picture.
 */
export function CategoryTiles({
  locale,
  dictionary,
  categories,
}: CategoryTilesProps) {
  const section = dictionary.home.categories;

  return (
    <section className="bg-surface-low py-14 lg:py-20">
      <Container>
        <SectionHeader
          title={section.title}
          subtitle={section.subtitle}
          actionLabel={dictionary.common.viewAll}
          actionHref={`/${locale}/categories`}
        />

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/${locale}/categories/${category.slug}`}
                className="group flex h-full items-start gap-3 rounded-xl border border-line bg-card p-4 transition-[box-shadow,border-color] duration-100 ease-fluent hover:border-line-hover hover:elevation-md focus-within:elevation-md"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary transition-colors duration-100 ease-fluent group-hover:bg-primary-container group-hover:text-on-primary-container">
                  <CategoryIcon name={category.icon} className="size-5" />
                </span>

                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-body-lg font-bold text-on-surface">
                    {category.name[locale]}
                  </span>
                  <span className="line-clamp-2 text-body-md leading-relaxed text-muted">
                    {category.description[locale]}
                  </span>
                  <span className="text-label-md text-muted" data-numeric>
                    {formatNumber(category.booksCount, locale)} {section.count}
                  </span>
                </span>

                <ChevronRight
                  aria-hidden
                  className="ms-auto size-4 shrink-0 text-muted transition-transform duration-100 ease-fluent group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                  strokeWidth={1.75}
                />
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
