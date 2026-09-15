import Link from "next/link";

import { CategoryIcon } from "@/components/ui/category-icon";
import { Container } from "@/components/ui/container";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/lib/format";
import type { HandoutCategoryNode } from "@/types";

interface HandoutBranchStripProps {
  branches: HandoutCategoryNode[];
  locale: Locale;
  title: string;
  subtitle: string;
  /** The word after the count — "ملزمة". */
  countLabel: string;
}

/**
 * `BranchStrip` over the handouts' tree: the branches under the one being
 * browsed, as a row of chips above its catalogue, each with its count.
 */
export function HandoutBranchStrip({
  branches,
  locale,
  title,
  subtitle,
  countLabel,
}: HandoutBranchStripProps) {
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
                href={`/handouts/categories/${branch.slug}`}
                className="flex items-center gap-2 rounded-xl border border-line bg-card px-3 py-2 text-label-md text-on-surface transition-colors duration-100 ease-fluent hover:border-line-hover hover:bg-card-hover"
              >
                <CategoryIcon name={branch.icon} className="size-4 text-primary" />
                <span>{branch.name[locale]}</span>
                <span className="text-muted" data-numeric>
                  {formatNumber(branch.handoutsCount, locale)} {countLabel}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </nav>
  );
}
