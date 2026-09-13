import Link from "next/link";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatNumber } from "@/lib/format";
import type { HandoutWithRelations } from "@/types";

interface HandoutSpecsProps {
  handout: HandoutWithRelations;
  locale: Locale;
  dictionary: Dictionary;
}

/** Bibliographic data as a hairline-separated definition list. */
export function HandoutSpecs({ handout, locale, dictionary }: HandoutSpecsProps) {
  const t = dictionary.handoutDetails.specs;

  const rows: {
    label: string;
    value: string;
    numeric?: boolean;
    href?: string;
  }[] = [
    {
      label: t.publisher,
      value: handout.publisher.name[locale],
      href: `/publishers/${handout.publisher.slug}`,
    },
    { label: t.publishedYear, value: String(handout.publishedYear), numeric: true },
    { label: t.pages, value: formatNumber(handout.pages, locale), numeric: true },
    { label: t.language, value: handout.language[locale] },
    { label: t.isbn, value: handout.isbn, numeric: true },
    {
      label: t.coverType,
      value:
        handout.coverType === "hardcover"
          ? dictionary.handouts.hardcover
          : dictionary.handouts.paperback,
    },
    {
      label: t.weight,
      value: `${formatNumber(handout.weightGrams, locale)} ${t.grams}`,
      numeric: true,
    },
  ];

  return (
    <dl className="divide-y divide-line-divider">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex flex-wrap items-baseline justify-between gap-2 py-3 first:pt-0 last:pb-0"
        >
          <dt className="text-label-md text-muted">{row.label}</dt>
          <dd
            className="text-body-md font-medium text-on-surface"
            {...(row.numeric ? { "data-numeric": true } : {})}
          >
            {row.href ? (
              <Link
                href={row.href}
                className="underline-offset-4 hover:text-primary hover:underline"
              >
                {row.value}
              </Link>
            ) : (
              row.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
