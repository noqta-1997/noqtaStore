import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/lib/format";
import type { Author, BookWithRelations, Category, PickOption, Publisher } from "@/types";

/** A book as one of the panel's pickers lists it. */
export function bookPick(book: BookWithRelations, locale: Locale): PickOption {
  return {
    id: book.id,
    label: book.title[locale],
    sublabel: book.author.name[locale],
    seed: book.slug,
    picture: { kind: "jacket", src: book.coverUrl },
  };
}

/** A category as the picker lists it: its icon stands in for a jacket. */
export function categoryPick(category: Category, locale: Locale): PickOption {
  return {
    id: category.id,
    label: category.name[locale],
    sublabel: category.description[locale],
    seed: category.slug,
    picture: { kind: "icon", name: category.icon },
  };
}

/** An author as the picker lists them: the card's second line under the name. */
export function authorPick(author: Author, locale: Locale, booksLabel: string): PickOption {
  return {
    id: author.id,
    label: author.name[locale],
    sublabel: `${author.country[locale]} · ${formatNumber(author.booksCount, locale)} ${booksLabel}`,
    seed: author.slug,
    picture: { kind: "portrait" },
  };
}

/**
 * A publisher as the picker lists it. The row the page loads counts only
 * its school books, so the second line is the country and that count; the
 * search results, which count both kinds, say more.
 */
export function publisherPick(publisher: Publisher, locale: Locale, booksLabel: string): PickOption {
  return {
    id: publisher.id,
    label: publisher.name[locale],
    sublabel: [publisher.country[locale], `${formatNumber(publisher.booksCount, locale)} ${booksLabel}`]
      .filter(Boolean)
      .join(" · "),
    seed: publisher.slug,
    picture: { kind: "mark" },
  };
}
