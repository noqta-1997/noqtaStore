import { BookCard } from "@/components/book/book-card";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/utils";
import type { BookWithRelations } from "@/types";

interface BookGridProps {
  books: BookWithRelations[];
  locale: Locale;
  dictionary: Dictionary["common"];
  /** Tailwind grid-cols classes; defaults suit a full-width shelf. */
  columns?: string;
  priority?: boolean;
  className?: string;
}

/** The catalogue grid — one place decides card spacing and breakpoints. */
export function BookGrid({
  books,
  locale,
  dictionary,
  columns = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  priority = false,
  className,
}: BookGridProps) {
  return (
    <ul className={cn("grid gap-4 sm:gap-5 xl:gap-6", columns, className)}>
      {books.map((book, index) => (
        <li key={book.id} className="flex">
          <BookCard
            book={book}
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
