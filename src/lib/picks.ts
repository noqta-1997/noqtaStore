import type { Locale } from "@/i18n/config";
import type { BookWithRelations, Category, PickOption } from "@/types";

/** A book as one of the panel's pickers lists it. */
export function bookPick(book: BookWithRelations, locale: Locale): PickOption {
  return {
    id: book.id,
    label: book.title[locale],
    sublabel: book.author.name[locale],
    seed: book.slug,
    coverUrl: book.coverUrl,
  };
}

/** A category as the picker lists it: its icon stands in for a jacket. */
export function categoryPick(category: Category, locale: Locale): PickOption {
  return {
    id: category.id,
    label: category.name[locale],
    sublabel: category.description[locale],
    seed: category.slug,
    icon: category.icon,
  };
}
