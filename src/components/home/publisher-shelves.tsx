import type { ReactElement } from "react";

import { BookShelf } from "@/components/book/book-shelf";
import { HandoutShelf } from "@/components/handout/handout-shelf";
import type { PublisherShelf } from "@/data";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { fillPublisherText } from "@/lib/home-sections";

interface PublisherShelvesProps {
  shelves: PublisherShelf[];
  locale: Locale;
  dictionary: Dictionary;
}

/**
 * A run of shelves, two to a publisher: the press's latest handouts, then
 * its latest school books, each drawn exactly as the new-arrivals shelf is
 * and titled with the press's name. A press with nothing of one kind gets
 * only the other shelf, and the band alternates shelf by shelf so the run
 * keeps the page's rhythm of plain and tinted whatever its length; it
 * follows a tinted shelf, so it opens on the plain page.
 */
export function PublisherShelves({ shelves, locale, dictionary }: PublisherShelvesProps) {
  const texts = dictionary.home.publishers;
  let band = false;

  return shelves.flatMap(({ publisher, handouts, books }) => {
    const name = publisher.name[locale];
    const nodes: ReactElement[] = [];

    if (handouts.length) {
      nodes.push(
        <HandoutShelf
          key={`${publisher.id}-handouts`}
          title={fillPublisherText(texts.handoutsTitle, name)}
          subtitle={fillPublisherText(texts.handoutsSubtitle, name)}
          handouts={handouts}
          locale={locale}
          dictionary={dictionary.common}
          actionHref={`/handouts?publisher=${publisher.slug}`}
          band={band}
        />,
      );
      band = !band;
    }

    if (books.length) {
      nodes.push(
        <BookShelf
          key={`${publisher.id}-books`}
          title={fillPublisherText(texts.booksTitle, name)}
          subtitle={fillPublisherText(texts.booksSubtitle, name)}
          books={books}
          locale={locale}
          dictionary={dictionary.common}
          actionHref={`/books?publisher=${publisher.slug}`}
          band={band}
        />,
      );
      band = !band;
    }

    return nodes;
  });
}
