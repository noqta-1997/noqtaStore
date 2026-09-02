import { ArrowRight } from "lucide-react";
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

export function CategoryTiles({
  locale,
  dictionary,
  categories,
}: CategoryTilesProps) {
  const section = dictionary.home.categories;

  return (
    <section className="border-y-2 border-line bg-surface-low py-12 lg:py-16">
      <Container>
        <SectionHeader
          title={section.title}
          subtitle={section.subtitle}
          actionLabel={dictionary.common.viewAll}
          actionHref={`/${locale}/categories`}
        />

        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/${locale}/categories/${category.slug}`}
                className="group flex h-full flex-col gap-3 rounded-md border border-line bg-card p-4 transition-[box-shadow,background-color] duration-100 ease-fluent hover:bg-card-hover hover:elevation-md focus-within:elevation-md"
              >
                <span className="flex size-11 items-center justify-center rounded-md border border-line bg-surface-low transition-colors group-hover:bg-primary-container group-hover:text-on-primary-container">
                  <CategoryIcon name={category.icon} className="size-5" />
                </span>

                <span className="font-display text-base font-bold text-on-surface">
                  {category.name[locale]}
                </span>

                <span className="line-clamp-2 text-sm leading-relaxed text-muted">
                  {category.description[locale]}
                </span>

                <span className="mt-auto flex items-center justify-between gap-2 border-t border-line-divider pt-3">
                  <span className="font-mono text-xs text-muted" data-numeric>
                    {formatNumber(category.booksCount, locale)} {section.count}
                  </span>
                  <ArrowRight
                    aria-hidden
                    className="size-4 text-on-surface transition-transform duration-100 ease-fluent group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                    strokeWidth={2}
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
