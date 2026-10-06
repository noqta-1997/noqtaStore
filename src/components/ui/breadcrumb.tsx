import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: Crumb[];
  label: string;
  className?: string;
}

/**
 * The trail as a schema.org `BreadcrumbList`, which is what turns a result's
 * bare URL into "نُقطة › الملازم › …" on a search page. Every step but the
 * last must name its page; a trail with a gap in the middle is left out
 * rather than published half-true.
 */
function breadcrumbData(items: Crumb[]) {
  if (items.length < 2 || items.slice(0, -1).some((item) => !item.href)) return null;

  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: absoluteUrl(item.href) } : {}),
    })),
  };
}

/** Trail of links; the last item is the current page and is not a link. */
export function Breadcrumb({ items, label, className }: BreadcrumbProps) {
  const data = breadcrumbData(items);

  return (
    <nav aria-label={label} className={cn("min-w-0", className)}>
      {data ? <JsonLd data={data} /> : null}
      <ol className="flex flex-wrap items-center gap-1.5 text-label-md text-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="underline-offset-4 hover:text-on-surface hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className="font-medium text-on-surface">
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <ChevronLeft
                  aria-hidden
                  className="size-3.5 shrink-0 rtl:rotate-180"
                  strokeWidth={1.75}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
