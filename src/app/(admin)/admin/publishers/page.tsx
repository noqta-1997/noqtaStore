import type { Metadata } from "next";

import { deletePublisher } from "@/app/actions/admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/admin/data-table";
import { Panel } from "@/components/admin/panel";
import { PublisherForm } from "@/components/admin/publisher-form";
import { RowActions } from "@/components/admin/row-actions";
import { TableToolbar } from "@/components/admin/table-toolbar";
import { PublisherMark } from "@/components/publisher/publisher-card";
import { HeldCount } from "@/components/admin/held-count";
import { getArchivedTitleCounts, getPublishers } from "@/data";
import { arabicKey } from "@/lib/arabic";
import { defaultLocale } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";
import { readParam, type SearchParamsRecord } from "@/lib/search-params";

interface AdminPublishersPageProps {
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata(): Promise<Metadata> {
  const admin = await getAdminDictionary(defaultLocale);

  return { title: `${admin.publishers.title} — ${admin.brand.panel}` };
}

export default async function AdminPublishersPage({
  searchParams,
}: AdminPublishersPageProps) {
  const locale = defaultLocale;

  const term = readParam(await searchParams, "q");

  const [dictionary, admin, allPublishers, archived] = await Promise.all([
    getDictionary(locale),
    getAdminDictionary(locale),
    getPublishers(),
    getArchivedTitleCounts("publisherId"),
  ]);

  // Spelling-blind, like the key that refuses a second «مكتبة» spelled «مكتبه».
  const publishers = term
    ? allPublishers.filter((publisher) =>
        arabicKey(`${publisher.name.ar} ${publisher.slug}`).includes(arabicKey(term)),
      )
    : allPublishers;

  const t = admin.publishers;

  return (
    <>
      <AdminPageHeader title={t.title} subtitle={t.subtitle} />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="min-w-0 space-y-4 lg:col-span-8">
          <TableToolbar
            action={`/admin/publishers`}
            searchLabel={admin.common.search}
            searchPlaceholder={t.subtitle}
            defaultValue={term}
          />

          <Table minWidth="42rem">
            <Thead>
              <Tr>
                <Th>{t.table.name}</Th>
                <Th>{t.table.handouts}</Th>
                <Th className="text-end">{admin.common.actions}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {publishers.map((publisher) => (
                <Tr key={publisher.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <PublisherMark
                        publisher={publisher}
                        className="size-9"
                        iconClassName="size-4"
                      />
                      <span className="min-w-0">
                        <span className="block font-semibold text-on-surface">
                          {publisher.name[locale]}
                        </span>
                        <span className="block max-w-72 truncate text-label-md text-muted">
                          {publisher.description[locale]}
                        </span>
                      </span>
                    </div>
                  </Td>
                  <Td data-numeric>
                    <HeldCount
                      count={publisher.handoutsCount}
                      notes={[{ count: archived.get(publisher.id) ?? 0, label: admin.common.archivedCount }]}
                      locale={locale}
                    />
                  </Td>
                  <Td>
                    <RowActions
                      viewHref={`/publishers/${publisher.slug}`}
                      editHref={`/admin/publishers/${publisher.id}/edit`}
                      itemName={publisher.name[locale]}
                      labels={{
                        view: admin.common.view,
                        edit: admin.common.edit,
                        delete: admin.common.delete,
                      }}
                      fallbackError={dictionary.common.toast.actionFailed}
                      errorMessages={dictionary.common.actionErrors}
                      deleteAction={deletePublisher.bind(null, publisher.id)}
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
          <PublisherForm admin={admin} dictionary={dictionary} />
        </Panel>
      </div>
    </>
  );
}
