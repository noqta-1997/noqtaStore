import type { Metadata } from "next";

import { deleteSubject } from "@/app/actions/admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/admin/data-table";
import { Panel } from "@/components/admin/panel";
import { RowActions } from "@/components/admin/row-actions";
import { SubjectForm } from "@/components/admin/subject-form";
import { CategoryIcon } from "@/components/ui/category-icon";
import { getSubjects, getSubjectTeacherCounts } from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const admin = await getAdminDictionary(defaultLocale);

  return { title: `${admin.subjects.title} — ${admin.brand.panel}` };
}

/** The subjects as one flat list, with the add form beside it — the publishers page's layout. */
export default async function AdminSubjectsPage() {
  const locale = defaultLocale;

  const [dictionary, admin, subjects, teachers] = await Promise.all([
    getDictionary(locale),
    getAdminDictionary(locale),
    getSubjects(),
    getSubjectTeacherCounts(),
  ]);

  const t = admin.subjects;

  return (
    <>
      <AdminPageHeader title={t.title} subtitle={t.subtitle} />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          <Table minWidth="28rem">
            <Thead>
              <Tr>
                <Th>{t.table.name}</Th>
                <Th>{t.table.teachers}</Th>
                <Th className="text-end">{admin.common.actions}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {subjects.map((subject) => (
                <Tr key={subject.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
                        <CategoryIcon name={subject.icon} src={subject.imageUrl} className="size-6" />
                      </span>
                      <span className="font-semibold text-on-surface">
                        {subject.name[locale]}
                      </span>
                    </div>
                  </Td>
                  <Td data-numeric>{teachers.get(subject.id) ?? 0}</Td>
                  <Td>
                    <RowActions
                      editHref={`/admin/subjects/${subject.id}/edit`}
                      itemName={subject.name[locale]}
                      labels={{
                        view: admin.common.view,
                        edit: admin.common.edit,
                        delete: admin.common.delete,
                      }}
                      fallbackError={dictionary.common.toast.actionFailed}
                      errorMessages={dictionary.common.actionErrors}
                      deleteAction={deleteSubject.bind(null, subject.id)}
                      confirm={{
                        title: dictionary.common.confirm.deleteTitle,
                        description: dictionary.common.confirm.deleteDescription,
                        confirm: dictionary.common.confirm.confirm,
                        cancel: dictionary.common.confirm.cancel,
                        done: dictionary.common.toast.deleted,
                        trigger: admin.common.delete,
                      }}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>

        <Panel title={t.form.title} className="min-w-0 lg:col-span-4">
          <SubjectForm admin={admin} dictionary={dictionary} />
        </Panel>
      </div>
    </>
  );
}
