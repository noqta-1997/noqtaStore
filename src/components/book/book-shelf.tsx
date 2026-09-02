import { BookGrid } from "@/components/book/book-grid";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/utils";
import type { BookWithRelations } from "@/types";

interface BookShelfProps {
  title: string;
  subtitle?: string;
  books: BookWithRelations[];
  locale: Locale;
  dictionary: Dictionary["common"];
  actionHref?: string;
  priority?: boolean;
  /**
   * Sets the shelf on the beige band. The reference alternates plain page and
   * band down the whole home page; this is how a shelf opts into the band.
   */
  band?: boolean;
  /** Tailwind grid-cols classes, forwarded to the grid. */
  columns?: string;
  className?: string;
}

/** A titled row of book cards — reused by every "shelf" on the site. */
export function BookShelf({
  title,
  subtitle,
  books,
  locale,
  dictionary,
  actionHref,
  priority = false,
  band = false,
  columns,
  className,
}: BookShelfProps) {
  return (
    <section
      className={cn(
        "py-14 lg:py-20",
        band && "bg-surface-low",
        className,
      )}
    >
      <Container>
        <SectionHeader
          title={title}
          subtitle={subtitle}
          actionLabel={actionHref ? dictionary.viewAll : undefined}
          actionHref={actionHref}
        />

        <BookGrid
          books={books}
          locale={locale}
          dictionary={dictionary}
          columns={columns}
          priority={priority}
        />
      </Container>
    </section>
  );
}
