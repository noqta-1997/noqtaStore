import Link from "next/link";

import { CategoryIcon } from "@/components/ui/category-icon";
import { Container } from "@/components/ui/container";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/lib/format";
import type { CategoryNode } from "@/types";

interface BranchStripProps {
  branches: CategoryNode[];
  locale: Locale;
  title: string;
  subtitle: string;
  /** The word after the count — "عنوان". */
  countLabel: string;
}

/**
 * The branches under the one being browsed, as a row of chips above its
 * catalogue: a stage offers its grades, a grade its scientific and literary
 * halves. Each chip carries the branch's count so an empty one is not a
 * surprise on the other side.
 */
export function BranchStrip({
  branches,
  locale,
  title,
  subtitle,
  countLabel,
}: BranchStripProps) {
  return (
    <nav aria-label={title} className="border-b border-line-divider">
      <Container className="space-y-3 py-6">
        <div className="space-y-0.5">
          <h2 className="text-headline-md">{title}</h2>
          <p className="text-body-md text-muted">{subtitle}</p>
        </div>
        <ul className="flex flex-wrap gap-2">
          {branches.map((branch) => (
            <li key={branch.id}>
              <Link
                href={`/categories/${branch.slug}`}
                className="flex items-center gap-2 rounded-xl border border-line bg-card px-3 py-2 text-label-md text-on-surface transition-colors duration-100 ease-fluent hover:border-line-hover hover:bg-card-hover"
              >
                <CategoryIcon name={branch.icon} className="size-4 text-primary" />
                <span>{branch.name[locale]}</span>
                <span className="text-muted" data-numeric>
                  {formatNumber(branch.booksCount, locale)} {countLabel}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </nav>
  );
}
