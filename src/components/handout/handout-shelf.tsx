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
  /** Sets the shelf on the tinted band, so a run of shelves alternates. */
  band?: boolean;
  /** Tailwind grid-cols classes, forwarded to the grid. */
  columns?: string;
  className?: string;
}

/** A titled row of handout cards, with a "view all" link under it. */
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
        "py-6 lg:py-8",
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
