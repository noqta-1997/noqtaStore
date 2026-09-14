import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { HomeFeaturesFields } from "@/components/admin/home-features-fields";
import { HomeHeroFields } from "@/components/admin/home-hero-fields";
import { HomePromoFields } from "@/components/admin/home-promo-fields";
import { HomeSectionForm } from "@/components/admin/home-section-form";
import { HomeShelfFields } from "@/components/admin/home-shelf-fields";
import {
  getAuthorsByIds,
  getBookById,
  getBooksByIds,
  getCategoriesByIds,
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
  readPromoContent,
  readShelfContent,
  type HomeSection,
  type ShelfKind,
} from "@/lib/home-sections";
import { authorPick, bookPick, categoryPick } from "@/lib/picks";
import type { PickOption } from "@/types";

interface HomeSectionPageProps {
  params: Promise<{ section: string }>;
}

/** The sections that have an edit page so far; the rest 404 until they do. */
const editable: readonly HomeSection[] = [
  "hero",
  "features",
  "bestsellers",
  "categories",
  "promo",
  "newArrivals",
  "authors",
];

async function resolveSection(params: HomeSectionPageProps["params"]) {
  const { section } = await params;
  return isHomeSection(section) && editable.includes(section) ? section : null;
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
    case "book":
      return (await getBooksByIds(ids)).map((book) => bookPick(book, locale));
    case "category":
      return (await getCategoriesByIds(ids)).map((category) => categoryPick(category, locale));
    case "author":
      return (await getAuthorsByIds(ids)).map((author) =>
        authorPick(author, locale, texts.authors.booksCount),
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
    const [featured, showcase] = await Promise.all([
      hero.featuredBookId ? getBookById(hero.featuredBookId) : undefined,
      getBooksByIds(hero.showcaseIds),
    ]);

    fields = (
      <HomeHeroFields
        locale={locale}
        admin={admin}
        texts={texts.hero}
        content={hero}
        featured={featured ? bookPick(featured, locale) : null}
        showcase={showcase.map((book) => bookPick(book, locale))}
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
        }))}
        content={content}
        picks={picks}
      />
    );
  } else if (section === "promo") {
    fields = (
      <HomePromoFields admin={admin} texts={texts.promo} content={readPromoContent(settings)} />
    );
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
