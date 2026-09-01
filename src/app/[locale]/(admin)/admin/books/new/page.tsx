import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { BookForm } from "@/components/admin/book-form";
import { getAuthors, getCategories, getPublishers } from "@/data";
import { isLocale } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";

interface NewBookPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: NewBookPageProps): Promise<Metadata> {
  const { locale } = await params;
  const admin = await getAdminDictionary(isLocale(locale) ? locale : "ar");

  return { title: `${admin.bookForm.addTitle} — ${admin.brand.panel}` };
}

export default async function NewBookPage({ params }: NewBookPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const [dictionary, admin, authors, publishers, categories] = await Promise.all([
    getDictionary(locale),
    getAdminDictionary(locale),
    getAuthors(),
    getPublishers(),
    getCategories(),
  ]);

  return (
    <>
      <AdminPageHeader
        title={admin.bookForm.addTitle}
        subtitle={admin.bookForm.addSubtitle}
      />

      <BookForm
        locale={locale}
        admin={admin}
        dictionary={dictionary}
        authors={authors}
        categories={categories}
        publishers={publishers}
        cancelHref={`/${locale}/admin/books`}
      />
    </>
  );
}
