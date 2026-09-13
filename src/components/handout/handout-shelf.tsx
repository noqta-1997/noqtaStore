import { HandoutGrid } from "@/components/handout/handout-grid";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/utils";
import type { HandoutWithRelations } from "@/types";

interface HandoutShelfProps {
  title: string;
  subtitle?: string;
  handouts: HandoutWithRelations[];
  locale: Locale;
  dictionary: Dictionary["common"];
  actionHref?: string;
  priority?: boolean;
  /** Sets the shelf on the tinted band, the way `BookShelf` does. */
  band?: boolean;
  /** Tailwind grid-cols classes, forwarded to the grid. */
  columns?: string;
  className?: string;
}

/** A titled row of handout cards — `BookShelf` for the other catalogue. */
export function HandoutShelf({
  title,
  subtitle,
  handouts,
  locale,
  dictionary,
  actionHref,
  priority = false,
  band = false,
  columns,
  className,
}: HandoutShelfProps) {
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

        <HandoutGrid
          handouts={handouts}
          locale={locale}
          dictionary={dictionary}
          columns={columns}
          priority={priority}
        />
      </Container>
    </section>
  );
}
