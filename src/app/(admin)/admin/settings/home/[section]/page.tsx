import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { HomeFeaturesFields } from "@/components/admin/home-features-fields";
import { HomeHeroFields } from "@/components/admin/home-hero-fields";
import { HomeNewsletterFields } from "@/components/admin/home-newsletter-fields";
import { HomeSectionForm } from "@/components/admin/home-section-form";
import { HomeShelfFields } from "@/components/admin/home-shelf-fields";
import {
  getAuthorsByIds,
  getHandoutsByIds,
  getPublishersByIds,
  getStoreSettings,
} from "@/data";
import { defaultLocale, type Locale } from "@/i18n/config";
import {
  getAdminDictionary,
  getDictionary,
  type Dictionary,
} from "@/i18n/get-dictionary";
import {
  applyHomeTexts,
  HOME_SHELVES,
  HOME_TEXT_FIELDS,
  homeTextDefault,
  isHomeSection,
  isHomeShelf,
  readHeroContent,
  readShelfContent,
  type ShelfKind,
} from "@/lib/home-sections";
import { authorPick, handoutPick, publisherPick } from "@/lib/picks";
import type { PickOption } from "@/types";

interface HomeSectionPageProps {
  params: Promise<{ section: string }>;
}

async function resolveSection(params: HomeSectionPageProps["params"]) {
  const { section } = await params;
  return isHomeSection(section) ? section : null;
}

export async function generateMetadata({ params }: HomeSectionPageProps): Promise<Metadata> {
  const [section, admin] = await Promise.all([
    resolveSection(params),
    getAdminDictionary(defaultLocale),
  ]);

  const title = section ? admin.settings.home.sections[section].title : admin.settings.home.title;
  return { title: `${title} — ${admin.brand.panel}` };
}

/** The picked entries of a shelf, as its picker lists them. */
async function shelfPicks(
  kind: ShelfKind,
  ids: string[],
  locale: Locale,
  texts: Dictionary["home"],
): Promise<PickOption[]> {
  switch (kind) {
    case "author":
      return (await getAuthorsByIds(ids)).map((author) =>
        authorPick(author, locale, texts.authors.handoutsCount),
      );
    case "publisher":
      return (await getPublishersByIds(ids)).map((publisher) =>
        publisherPick(publisher, locale, texts.authors.handoutsCount),
      );
  }
}

export default async function HomeSectionPage({ params }: HomeSectionPageProps) {
  const locale = defaultLocale;

  const section = await resolveSection(params);
  if (!section) notFound();

  const [dictionary, admin, settings] = await Promise.all([
    getDictionary(locale),
    getAdminDictionary(locale),
    getStoreSettings(),
  ]);

  const t = admin.settings.home;
  const copy = t.sections[section];
  const texts = applyHomeTexts(dictionary.home, settings);
  const backHref = `/admin/settings?tab=home`;

  let fields: ReactNode;

  if (section === "hero") {
    const hero = readHeroContent(settings);
    /* Both through the on-shelf read: an archived pick is off sale, the save
       would refuse it, and the form used to show it anyway — so every save
       of the hero, a link included, failed until the admin guessed which
       title to remove. */
    const [[featured], showcase] = await Promise.all([
      getHandoutsByIds(hero.featuredHandoutId ? [hero.featuredHandoutId] : []),
      getHandoutsByIds(hero.showcaseIds),
    ]);

    fields = (
      <HomeHeroFields
        locale={locale}
        admin={admin}
        texts={texts.hero}
        content={hero}
        featured={featured ? handoutPick(featured, locale) : null}
        showcase={showcase.map((handout) => handoutPick(handout, locale))}
      />
    );
  } else if (isHomeShelf(section)) {
    const content = readShelfContent(settings, section);
    const picks = await shelfPicks(HOME_SHELVES[section].kind, content.ids, locale, texts);

    fields = (
      <HomeShelfFields
        shelf={section}
        locale={locale}
        admin={admin}
        texts={(HOME_TEXT_FIELDS[section] as readonly string[]).map((name) => ({
          name,
          label: t.shelf.texts[name as keyof typeof t.shelf.texts],
          value: homeTextDefault(texts, section, name),
          /* The presses' strings carry the publisher's name; the hint says how. */
          hint: section === "publishers" ? t.shelf.placeholderHint : undefined,
        }))}
        content={content}
        picks={picks}
      />
    );
  } else if (section === "newsletter") {
    fields = <HomeNewsletterFields admin={admin} texts={texts.newsletter} />;
  } else {
    fields = <HomeFeaturesFields admin={admin} texts={texts.features} />;
  }

  return (
    <>
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-label-md text-on-surface underline-offset-4 hover:underline"
      >
        <ArrowRight aria-hidden className="size-4 rotate-180 rtl:rotate-0" strokeWidth={1.75} />
        {t.title}
      </Link>

      <AdminPageHeader title={copy.title} subtitle={copy.description} />

      <HomeSectionForm
        section={section}
        admin={admin}
        dictionary={dictionary}
        cancelHref={backHref}
      >
        {fields}
      </HomeSectionForm>
    </>
  );
}
