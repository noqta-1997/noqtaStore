import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { BookCover } from "@/components/book/book-cover";
import { CategoryIcon } from "@/components/ui/category-icon";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatNumber } from "@/lib/format";
import type { HandoutCategoryNode, HandoutWithRelations } from "@/types";

interface HandoutBranchCardProps {
  branch: HandoutCategoryNode;
  /** A few jackets from anywhere under the branch, so the card shows what is inside. */
  handouts: HandoutWithRelations[];
  locale: Locale;
  dictionary: Dictionary;
}

/**
 * `BranchCard` over the handouts' tree: a top-level branch on the handout
 * categories page, its grades as links of their own with a grade's branches
 * on the same line, and a few jackets from under it.
 */
export function HandoutBranchCard({
  branch,
  handouts,
  locale,
  dictionary,
}: HandoutBranchCardProps) {
  const t = dictionary.handoutCategoriesPage;
  const href = `/handouts/categories/${branch.slug}`;

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
                href={`/handouts/categories/${child.slug}`}
                className="text-body-md text-on-surface underline-offset-4 hover:text-primary hover:underline"
              >
                {child.name[locale]}
              </Link>
              {child.children.map((leaf) => (
                <Link
                  key={leaf.id}
                  href={`/handouts/categories/${leaf.slug}`}
                  className="text-label-md text-muted underline-offset-4 before:me-2 before:content-['·'] hover:text-primary hover:underline"
                >
                  {leaf.name[locale]}
                </Link>
              ))}
            </li>
          ))}
        </ul>
      ) : null}

      {handouts.length ? (
        <ul className="flex gap-2">
          {handouts.map((handout) => (
            <li key={handout.id} className="w-16">
              <BookCover
                title={handout.title[locale]}
                author={handout.author.name[locale]}
                seed={handout.slug}
                src={handout.coverUrl}
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
          {formatNumber(branch.handoutsCount, locale)} {t.count}
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
