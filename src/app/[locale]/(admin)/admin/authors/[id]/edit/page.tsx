import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AuthorForm } from "@/components/admin/author-form";
import { Panel } from "@/components/admin/panel";
import { getAuthorById } from "@/data";
import { isLocale } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";

interface EditAuthorPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: EditAuthorPageProps): Promise<Metadata> {
  const { locale } = await params;
  const admin = await getAdminDictionary(isLocale(locale) ? locale : "ar");

  return { title: `${admin.authors.form.editTitle} — ${admin.brand.panel}` };
}

export default async function EditAuthorPage({ params }: EditAuthorPageProps) {
  const { locale, id } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const author = await getAuthorById(id);

  if (!author) {
    notFound();
  }

  const [dictionary, admin] = await Promise.all([
    getDictionary(locale),
    getAdminDictionary(locale),
  ]);

  const t = admin.authors.form;

  return (
    <>
      <Link
        href={`/${locale}/admin/authors`}
        className="inline-flex items-center gap-2 text-label-md text-on-surface underline-offset-4 hover:underline"
      >
        <ArrowRight aria-hidden className="size-4 rotate-180 rtl:rotate-0" strokeWidth={1.75} />
        {t.back}
      </Link>

      <AdminPageHeader title={t.editTitle} subtitle={author.name[locale]} />

      <Panel title={t.editSubtitle} className="max-w-2xl">
        <AuthorForm admin={admin} dictionary={dictionary} author={author} />
      </Panel>
    </>
  );
}
