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
 * A run of shelves, one to a publisher: the press's latest handouts, titled
 * with the press's name. A press with nothing on sale gets no shelf, and the
 * band alternates shelf by shelf so the run keeps the page's rhythm of plain
 * and tinted whatever its length; it opens on the plain page.
 */
export function PublisherShelves({ shelves, locale, dictionary }: PublisherShelvesProps) {
  const texts = dictionary.home.publishers;

  return shelves
    .filter(({ handouts }) => handouts.length)
    .map(({ publisher, handouts }, index) => {
      const name = publisher.name[locale];

      return (
        <HandoutShelf
          key={publisher.id}
          title={fillPublisherText(texts.handoutsTitle, name)}
          subtitle={fillPublisherText(texts.handoutsSubtitle, name)}
          handouts={handouts}
          locale={locale}
          dictionary={dictionary.common}
          actionHref={`/handouts?publisher=${publisher.slug}`}
          band={index % 2 === 1}
        />
      );
    });
}
