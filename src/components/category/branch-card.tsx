import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { BookCover } from "@/components/book/book-cover";
import { CategoryIcon } from "@/components/ui/category-icon";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatNumber } from "@/lib/format";
import type { BookWithRelations, CategoryNode } from "@/types";

interface BranchCardProps {
  branch: CategoryNode;
  /** A few jackets from anywhere under the branch, so the card shows what is inside. */
  books: BookWithRelations[];
  locale: Locale;
  dictionary: Dictionary;
}

/**
 * A top-level branch on the categories page: the stage, what it holds, and a
 * way in. The grades are listed as links of their own, and a grade's branches
 * follow it on the same line — the tree's three levels on one card. The card
 * used to be a single link; it cannot be now that it carries links inside.
 */
export function BranchCard({ branch, books, locale, dictionary }: BranchCardProps) {
  const t = dictionary.categoriesPage;
  const href = `/categories/${branch.slug}`;

  return (
    <article className="group flex h-full flex-col gap-4 rounded-xl border border-line bg-card p-5 transition-[box-shadow,background-color] duration-100 ease-fluent hover:bg-card-hover hover:elevation-md focus-within:elevation-md">
      <Link href={href} className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary transition-colors group-hover:bg-primary-container group-hover:text-on-primary-container">
          <CategoryIcon name={branch.icon} className="size-5" />
        </span>
        <span className="min-w-0">
          <h2 className="font-display text-lg font-bold text-on-surface">
            {branch.name[locale]}
          </h2>
          <p className="text-body-md text-muted">{branch.description[locale]}</p>
        </span>
      </Link>

      {branch.children.length ? (
        <ul className="space-y-1 border-t border-line-divider pt-3">
          {branch.children.map((child) => (
            <li key={child.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <Link
                href={`/categories/${child.slug}`}
                className="text-body-md text-on-surface underline-offset-4 hover:text-primary hover:underline"
              >
                {child.name[locale]}
              </Link>
              {child.children.map((leaf) => (
                <Link
                  key={leaf.id}
                  href={`/categories/${leaf.slug}`}
                  className="text-label-md text-muted underline-offset-4 before:me-2 before:content-['·'] hover:text-primary hover:underline"
                >
                  {leaf.name[locale]}
                </Link>
              ))}
            </li>
          ))}
        </ul>
      ) : null}

      {books.length ? (
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
                compact
              />
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line-divider pt-4">
        <span className="text-label-sm text-muted" data-numeric>
          {formatNumber(branch.booksCount, locale)} {dictionary.home.categories.count}
        </span>
        <Link
          href={href}
          className="flex items-center gap-1.5 text-label-md text-on-surface underline-offset-4 hover:underline"
        >
          {t.browse}
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform duration-100 ease-fluent group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
            strokeWidth={1.75}
          />
        </Link>
      </div>
    </article>
  );
}
