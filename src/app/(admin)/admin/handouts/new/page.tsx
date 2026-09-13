import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { HandoutForm } from "@/components/admin/handout-form";
import { getAuthors, getCategories, getPublishers } from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const admin = await getAdminDictionary(defaultLocale);

  return { title: `${admin.handoutForm.addTitle} — ${admin.brand.panel}` };
}

export default async function NewHandoutPage() {
  const locale = defaultLocale;

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
        title={admin.handoutForm.addTitle}
        subtitle={admin.handoutForm.addSubtitle}
      />

      <HandoutForm
        locale={locale}
        admin={admin}
        dictionary={dictionary}
        authors={authors}
        categories={categories}
        publishers={publishers}
        cancelHref={`/admin/handouts`}
      />
    </>
  );
}
