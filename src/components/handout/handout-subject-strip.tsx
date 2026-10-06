import Link from "next/link";

import { CategoryIcon } from "@/components/ui/category-icon";
import { Container } from "@/components/ui/container";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Subject } from "@/types";

interface HandoutSubjectStripProps {
  /** The subjects the branch has handouts in, each with its count. */
  subjects: { subject: Subject; count: number }[];
  /** The branch page the chips filter. */
  basePath: string;
  /** The subject filtered on, by slug. */
  current?: string;
  locale: Locale;
  title: string;
  subtitle: string;
  allLabel: string;
  /** The word after the count — "ملزمة". */
  countLabel: string;
}

const chipStyles =
  "flex items-center gap-2 rounded-xl border px-3 py-2 text-label-md transition-colors duration-100 ease-fluent";

/**
 * A branch's subjects as a row of chips above its catalogue, the way
 * `HandoutBranchStrip` lists its branches: «الكل», then one chip per subject
 * the branch has handouts in, each leading to the branch filtered to it.
 */
export function HandoutSubjectStrip({
  subjects,
  basePath,
  current,
  locale,
  title,
  subtitle,
  allLabel,
  countLabel,
}: HandoutSubjectStripProps) {
  const chip = (active: boolean) =>
    cn(
      chipStyles,
      active
        ? "border-primary-container bg-primary-fixed text-primary"
        : "border-line bg-card text-on-surface hover:border-line-hover hover:bg-card-hover",
    );

  return (
    <nav aria-label={title} className="border-b border-line-divider">
      <Container className="space-y-3 py-6">
        <div className="space-y-0.5">
          <h2 className="text-headline-md">{title}</h2>
          <p className="text-body-md text-muted">{subtitle}</p>
        </div>
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link href={basePath} aria-current={current ? undefined : "page"} className={chip(!current)}>
              {allLabel}
            </Link>
          </li>
          {subjects.map(({ subject, count }) => (
            <li key={subject.id}>
              <Link
                href={`${basePath}?subject=${encodeURIComponent(subject.slug)}`}
                aria-current={current === subject.slug ? "page" : undefined}
                className={chip(current === subject.slug)}
              >
                <CategoryIcon name={subject.icon} className="size-5" />
                <span>{subject.name[locale]}</span>
                <span className="text-muted" data-numeric>
                  {formatNumber(count, locale)} {countLabel}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </nav>
  );
}
