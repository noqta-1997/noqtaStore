import { HandoutCard } from "@/components/handout/handout-card";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/utils";
import type { HandoutWithRelations } from "@/types";

interface HandoutGridProps {
  handouts: HandoutWithRelations[];
  locale: Locale;
  dictionary: Dictionary["common"];
  /** Tailwind grid-cols classes; defaults suit a full-width shelf. */
  columns?: string;
  priority?: boolean;
  className?: string;
}

/** The handouts grid — same spacing and breakpoints as the book grid. */
export function HandoutGrid({
  handouts,
  locale,
  dictionary,
  columns = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  priority = false,
  className,
}: HandoutGridProps) {
  return (
    <ul className={cn("grid gap-4 sm:gap-5 xl:gap-6", columns, className)}>
      {handouts.map((handout, index) => (
        <li key={handout.id} className="flex">
          <HandoutCard
            handout={handout}
            locale={locale}
            dictionary={dictionary}
            priority={priority && index < 5}
            className="w-full"
          />
        </li>
      ))}
    </ul>
  );
}
