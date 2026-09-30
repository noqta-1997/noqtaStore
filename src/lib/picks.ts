import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/lib/format";
import type { Author, HandoutWithRelations, PickOption, Publisher } from "@/types";

/** A handout as one of the panel's pickers lists it. */
export function handoutPick(handout: HandoutWithRelations, locale: Locale): PickOption {
  return {
    id: handout.id,
    label: handout.title[locale],
    sublabel: handout.author.name[locale],
    seed: handout.slug,
    picture: { kind: "jacket", src: handout.coverUrl },
  };
}

/** An author as the picker lists them: the card's second line under the name. */
export function authorPick(author: Author, locale: Locale, countLabel: string): PickOption {
  return {
    id: author.id,
    label: author.name[locale],
    sublabel: `${formatNumber(author.handoutsCount, locale)} ${countLabel}`,
    seed: author.slug,
    picture: { kind: "portrait" },
  };
}

/** A publisher as the picker lists it: its handout count under the name. */
export function publisherPick(publisher: Publisher, locale: Locale, countLabel: string): PickOption {
  return {
    id: publisher.id,
    label: publisher.name[locale],
    sublabel: `${formatNumber(publisher.handoutsCount, locale)} ${countLabel}`,
    seed: publisher.slug,
    picture: { kind: "mark" },
  };
}
