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
  className,
}: BookShelfProps) {
  return (
    <section className={cn("py-12 lg:py-16", className)}>
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
          priority={priority}
        />
      </Container>
    </section>
  );
}
