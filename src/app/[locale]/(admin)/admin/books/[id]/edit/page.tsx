import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { BookForm } from "@/components/admin/book-form";
import { getAuthors, getBookById, getCategories, getPublishers } from "@/data";
import { isLocale } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";

interface EditBookPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: EditBookPageProps): Promise<Metadata> {
  const { locale } = await params;
  const admin = await getAdminDictionary(isLocale(locale) ? locale : "ar");

  return { title: `${admin.bookForm.editTitle} — ${admin.brand.panel}` };
}

export default async function EditBookPage({ params }: EditBookPageProps) {
  const { locale, id } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const book = await getBookById(id);

  if (!book) {
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
        title={admin.bookForm.editTitle}
        subtitle={book.title[locale]}
      />

      <BookForm
        locale={locale}
        admin={admin}
        dictionary={dictionary}
        authors={authors}
        categories={categories}
        publishers={publishers}
        book={book}
        cancelHref={`/${locale}/admin/books`}
      />
    </>
  );
}
