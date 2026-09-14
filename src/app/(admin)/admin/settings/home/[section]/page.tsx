import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { HomeHeroForm } from "@/components/admin/home-hero-form";
import { getBookById, getBooksByIds, getStoreSettings } from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";
import {
  applyHomeTexts,
  isHomeSection,
  readHeroContent,
  type HomeSection,
} from "@/lib/home-sections";
import { bookPick } from "@/lib/picks";

interface HomeSectionPageProps {
  params: Promise<{ section: string }>;
}

/** The sections that have an edit page so far; the rest 404 until they do. */
const editable: readonly HomeSection[] = ["hero"];

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

  const hero = readHeroContent(settings);
  const [featured, showcase] = await Promise.all([
    hero.featuredBookId ? getBookById(hero.featuredBookId) : undefined,
    getBooksByIds(hero.showcaseIds),
  ]);

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

      <HomeHeroForm
        locale={locale}
        admin={admin}
        dictionary={dictionary}
        texts={texts.hero}
        content={hero}
        featured={featured ? bookPick(featured, locale) : null}
        showcase={showcase.map((book) => bookPick(book, locale))}
        cancelHref={backHref}
      />
    </>
  );
}
