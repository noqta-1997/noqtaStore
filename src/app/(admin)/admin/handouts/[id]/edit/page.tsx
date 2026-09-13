import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { HandoutForm } from "@/components/admin/handout-form";
import { getAuthors, getCategories, getHandoutById, getPublishers } from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";

interface EditHandoutPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const admin = await getAdminDictionary(defaultLocale);

  return { title: `${admin.handoutForm.editTitle} — ${admin.brand.panel}` };
}

export default async function EditHandoutPage({ params }: EditHandoutPageProps) {
  const { id } = await params;
  const locale = defaultLocale;

  const handout = await getHandoutById(id);

  if (!handout) {
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
        title={admin.handoutForm.editTitle}
        subtitle={handout.title[locale]}
      />

      <HandoutForm
        locale={locale}
        admin={admin}
        dictionary={dictionary}
        authors={authors}
        categories={categories}
        publishers={publishers}
        handout={handout}
        cancelHref={`/admin/handouts`}
      />
    </>
  );
}
