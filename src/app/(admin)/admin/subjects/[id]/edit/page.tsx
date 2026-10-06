import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Panel } from "@/components/admin/panel";
import { SubjectForm } from "@/components/admin/subject-form";
import { getSubjectById } from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";

interface EditSubjectPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const admin = await getAdminDictionary(defaultLocale);

  return { title: `${admin.subjects.form.editTitle} — ${admin.brand.panel}` };
}

export default async function EditSubjectPage({ params }: EditSubjectPageProps) {
  const { id } = await params;
  const locale = defaultLocale;

  const subject = await getSubjectById(id);

  if (!subject) {
    notFound();
  }

  const [dictionary, admin] = await Promise.all([
    getDictionary(locale),
    getAdminDictionary(locale),
  ]);

  const t = admin.subjects.form;

  return (
    <>
      <Link
        href={`/admin/subjects`}
        className="inline-flex items-center gap-2 text-label-md text-on-surface underline-offset-4 hover:underline"
      >
        <ArrowRight aria-hidden className="size-4 rotate-180 rtl:rotate-0" strokeWidth={1.75} />
        {t.back}
      </Link>

      <AdminPageHeader title={t.editTitle} subtitle={subject.name[locale]} />

      <Panel title={t.editSubtitle} className="max-w-2xl">
        <SubjectForm admin={admin} dictionary={dictionary} subject={subject} />
      </Panel>
    </>
  );
}
