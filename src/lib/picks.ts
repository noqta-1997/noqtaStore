import type { Locale } from "@/i18n/config";
import type { BookWithRelations, PickOption } from "@/types";

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
