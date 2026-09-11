import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CategoryForm } from "@/components/admin/category-form";
import { Panel } from "@/components/admin/panel";
import { getCategoryById } from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const admin = await getAdminDictionary(defaultLocale);

  return { title: `${admin.categories.form.editTitle} — ${admin.brand.panel}` };
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params;
  const locale = defaultLocale;

  const category = await getCategoryById(id);

  if (!category) {
    notFound();
  }

  const [dictionary, admin] = await Promise.all([
    getDictionary(locale),
    getAdminDictionary(locale),
  ]);

  const t = admin.categories.form;

  return (
    <>
      <Link
        href={`/admin/categories`}
        className="inline-flex items-center gap-2 text-label-md text-on-surface underline-offset-4 hover:underline"
      >
        <ArrowRight aria-hidden className="size-4 rotate-180 rtl:rotate-0" strokeWidth={1.75} />
        {t.back}
      </Link>

      <AdminPageHeader title={t.editTitle} subtitle={category.name[locale]} />

      <Panel title={t.editSubtitle} className="max-w-2xl">
        <CategoryForm admin={admin} dictionary={dictionary} category={category} />
      </Panel>
    </>
  );
}
